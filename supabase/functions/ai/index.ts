// FinancePRO v2 — AI Edge Function (chat + receipt scanner)
// Deploy:  supabase functions deploy ai
// Secrets: supabase secrets set OPENAI_API_KEY=... GEMINI_API_KEY=...
// Tries OpenAI first, falls back to Gemini. API keys never reach the browser.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

const EXPENSE_CATS = ["groceries", "housing", "transport", "dining", "fun", "shopping", "health", "other_exp"];

type Msg = { role: "user" | "assistant" | "system"; content: string };

async function openai(messages: unknown[], jsonMode = false): Promise<string> {
  if (!OPENAI_KEY) throw new Error("no openai key");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL, messages, temperature: 0.4, max_tokens: 700,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!r.ok) throw new Error(`openai ${r.status}`);
  const d = await r.json();
  return d.choices[0].message.content;
}

async function gemini(system: string, parts: unknown[], jsonMode = false): Promise<string> {
  if (!GEMINI_KEY) throw new Error("no gemini key");
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 700, ...(jsonMode ? { responseMimeType: "application/json" } : {}) },
    }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const d = await r.json();
  return d.candidates[0].content.parts.map((p: { text?: string }) => p.text ?? "").join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // Authenticated client: every query runs under the user's row-level security.
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? req.headers.get("apikey") ?? "", {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: { mode?: string; message?: string; history?: Msg[]; image?: string; lang?: string; vault?: string };
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const lang = body.lang === "en" ? "English" : "Greek";
  const today = new Date().toISOString().slice(0, 10);

  try {
    // ------------------------------------------------------------ receipt scanner
    if (body.mode === "receipt") {
      const image = String(body.image ?? "");
      if (!image.startsWith("data:image/") || image.length > 4_000_000) return json({ error: "bad image" }, 400);
      const system = `You read shop receipts. Return ONLY JSON: {"amount": number (final total paid, with decimals), "date": "YYYY-MM-DD" or null, "category": one of ${JSON.stringify(EXPENSE_CATS)}, "note": short store name (max 40 chars)}. Today is ${today}. If unreadable return {"amount": null}.`;
      let out: string;
      try {
        out = await openai([{ role: "system", content: system }, { role: "user", content: [{ type: "text", text: "Read this receipt." }, { type: "image_url", image_url: { url: image } }] }], true);
      } catch (_) {
        const [meta, b64] = image.split(",");
        const mime = meta.slice(5, meta.indexOf(";"));
        out = await gemini(system, [{ text: "Read this receipt." }, { inlineData: { mimeType: mime, data: b64 } }], true);
      }
      const r = JSON.parse(out.replace(/^```json|```$/g, "").trim());
      const amount = Number(r.amount);
      return json({
        amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null,
        date: typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null,
        category: EXPENSE_CATS.includes(r.category) ? r.category : "other_exp",
        note: typeof r.note === "string" ? r.note.slice(0, 40) : "",
      });
    }

    // ------------------------------------------------------------ chat
    const message = String(body.message ?? "").slice(0, 1000);
    if (!message) return json({ error: "empty" }, 400);

    const since = new Date(); since.setMonth(since.getMonth() - 4); since.setDate(1);
    let q = sb.from("transactions").select("date,type,category,amount,note,user_id,vault_id")
      .gte("date", since.toISOString().slice(0, 10)).order("date", { ascending: false }).limit(1500);
    q = body.vault === "shared" ? q.not("vault_id", "is", null) : q.is("vault_id", null).eq("user_id", user.id);
    const { data: rows, error } = await q;
    if (error) throw error;

    // compact monthly summary + latest rows keeps the prompt small
    const months: Record<string, { income: number; expense: number; cats: Record<string, number> }> = {};
    for (const t of rows ?? []) {
      const m = (t.date as string).slice(0, 7);
      months[m] ??= { income: 0, expense: 0, cats: {} };
      if (t.type === "income") months[m].income += Number(t.amount);
      if (t.type === "expense") { months[m].expense += Number(t.amount); months[m].cats[t.category] = (months[m].cats[t.category] ?? 0) + Number(t.amount); }
    }
    const latest = (rows ?? []).slice(0, 60).map((t) => `${t.date} ${t.type} ${t.category} ${Number(t.amount).toFixed(2)} ${t.note ?? ""}`).join("\n");
    const { data: prof } = await sb.from("profiles").select("currency,savings_goal").eq("id", user.id).single();

    const system = `You are a friendly, practical personal-finance assistant inside the FinancePRO app. Answer in ${lang}, concisely (max ~150 words), with concrete numbers from the data. Use plain text and short bullet lists, no tables. You are not a licensed financial advisor: give budgeting guidance, never investment recommendations. Today is ${today}. Currency: ${prof?.currency ?? "EUR"}. Monthly savings goal: ${prof?.savings_goal ?? 0}. Category ids: groceries, housing (home & bills), transport, dining (eating out & coffee), fun (entertainment & travel), shopping, health, other_exp; income: salary, freelance, invest, refund, gifts, other_inc.
Monthly summary (${body.vault === "shared" ? "shared vault" : "personal"}):
${JSON.stringify(months)}
Latest transactions:
${latest || "(none)"}`;

    const history = (body.history ?? []).slice(-8).filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    if (!history.length || history[history.length - 1].content !== message) history.push({ role: "user", content: message });

    let reply: string;
    try {
      reply = await openai([{ role: "system", content: system }, ...history]);
    } catch (_) {
      reply = await gemini(system, [{ text: history.map((m) => `${m.role}: ${m.content}`).join("\n") }]);
    }
    return json({ reply });
  } catch (e) {
    console.error(e);
    return json({ error: "ai_failed" }, 502);
  }
});
