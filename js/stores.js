/*
 * Data layer. Two stores with the same async interface:
 *   DemoStore     – everything in the browser (localStorage), seeded with sample data
 *   SupabaseStore – real accounts, Postgres with row-level security, Edge Function for AI
 */
window.FP = window.FP || {};

FP.safeStorage = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

FP.defaultProfile = (id, name, email) => ({
  id, name: name || '', email: email || '',
  lang: 'el', currency: 'EUR', theme: 'auto',
  goal: 200, startBalance: 0,
  quick: [
    { id: 'q1', label: 'Καφές', amount: 3.5, category: 'dining' },
    { id: 'q2', label: 'Σούπερ μάρκετ', amount: 25, category: 'groceries' },
    { id: 'q3', label: 'Βενζίνη', amount: 30, category: 'transport' }
  ],
  bills: [],
  customCats: [],
  split: 50,
  partner: null,
  vaultId: null
});

/* ======================================================================
   DEMO STORE
   ====================================================================== */
FP.DemoStore = function () {
  const KEY = 'fp_demo_v2';
  const ME = 'demo-me', PARTNER = 'demo-partner';
  let db = null;

  function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function seed() {
    const r = rng(20261123);
    const pick = (a, b) => FP.round2(a + r() * (b - a));
    const txs = [];
    const today = new Date();
    const curYm = FP.ymOf(today);
    const add = (date, type, category, amount, note, vault, user) => {
      txs.push({ id: FP.uid(), date, type, category, amount: FP.round2(amount), note: note || '', vault: vault || 'personal', user: user || ME });
    };
    const notes = {
      groceries: ['Lidl', 'Σκλαβενίτης', 'ΑΒ Βασιλόπουλος', 'Μασούτης', 'Λαϊκή'],
      dining: ['Καφές', 'Freddo', 'Σουβλάκια', 'Pizza', 'Μεσημεριανό', 'Κρέπα'],
      transport: ['Βενζίνη', 'Βενζίνη', 'Εισιτήριο ΜΜΜ', 'Taxi'],
      fun: ['Σινεμά', 'Συναυλία', 'Ποτό', 'Βιβλίο'],
      shopping: ['Ρούχα', 'Skroutz', 'Παπούτσια', 'Δώρο'],
      health: ['Φαρμακείο', 'Οδοντίατρος']
    };
    const n = arr => arr[Math.floor(r() * arr.length)];

    for (let k = 5; k >= 0; k--) {
      const ym = FP.addMonths(curYm, -k);
      const last = k === 0 ? today.getDate() : FP.daysIn(ym);
      const d = day => ym + '-' + FP.pad(day);
      const inRange = day => day <= last;
      const heavier = k === 1 ? 1.15 : 1; // last month a bit more expensive → nicer comparison
      if (inRange(1)) add(d(1), 'income', 'salary', 1150, 'Μισθός φροντιστηρίου');
      [6, 13, 20, 27].forEach(day => { if (inRange(day)) add(d(day), 'income', 'freelance', pick(60, 120), 'Ιδιαίτερα'); });
      if (inRange(3)) add(d(3), 'expense', 'housing', 380, 'Ενοίκιο');
      if (inRange(12)) add(d(12), 'expense', 'housing', 15, 'Κινητό');
      if (inRange(22)) add(d(22), 'expense', 'housing', 30, 'Internet');
      if (inRange(26)) add(d(26), 'expense', 'fun', 13.99, 'Netflix');
      if (k > 0 && inRange(18)) add(d(18), 'expense', 'housing', pick(48, 75), 'ΔΕΗ');
      for (let i = 0; i < 7; i++) { const day = 1 + Math.floor(r() * 28); if (inRange(day)) add(d(day), 'expense', 'groceries', pick(12, 55) * heavier, n(notes.groceries)); }
      for (let i = 0; i < 11; i++) { const day = 1 + Math.floor(r() * 28); const nt = n(notes.dining); const cheap = nt === 'Καφές' || nt === 'Freddo' || nt === 'Κρέπα'; if (inRange(day)) add(d(day), 'expense', 'dining', (cheap ? pick(2.5, 5) : pick(9, 24)) * heavier, nt); }
      for (let i = 0; i < 4; i++) { const day = 1 + Math.floor(r() * 28); if (inRange(day)) add(d(day), 'expense', 'transport', pick(8, 42), n(notes.transport)); }
      for (let i = 0; i < 2; i++) { const day = 1 + Math.floor(r() * 28); if (inRange(day)) add(d(day), 'expense', 'fun', pick(12, 55) * heavier, n(notes.fun)); }
      if (r() > .3) { const day = 1 + Math.floor(r() * 28); if (inRange(day)) add(d(day), 'expense', 'shopping', pick(20, 90) * heavier, n(notes.shopping)); }
      if (r() > .6) { const day = 1 + Math.floor(r() * 28); if (inRange(day)) add(d(day), 'expense', 'health', pick(8, 40), n(notes.health)); }
      // shared vault
      for (let i = 0; i < 6; i++) {
        const day = 1 + Math.floor(r() * 28);
        if (!inRange(day)) continue;
        const who = r() > .45 ? ME : PARTNER;
        const cat = r() > .4 ? 'groceries' : 'dining';
        add(d(day), 'expense', cat, cat === 'groceries' ? pick(25, 80) : pick(18, 45), cat === 'groceries' ? n(notes.groceries) : 'Έξω για φαγητό', 'shared', who);
      }
      if (k === 2) add(d(28), 'settlement', 'settle_paid', 40, '', 'shared', PARTNER);
    }
    txs.sort((a, b) => b.date.localeCompare(a.date));

    const p = FP.defaultProfile(ME, 'Σπύρος', 'demo@financepro.app');
    p.startBalance = 850;
    p.goal = 400;
    p.partner = { id: PARTNER, name: 'Μαρία' };
    p.vaultId = 'demo-vault';
    p.quick = [
      { id: 'q1', label: 'Καφές', amount: 3.5, category: 'dining' },
      { id: 'q2', label: 'Σούπερ μάρκετ', amount: 25, category: 'groceries' },
      { id: 'q3', label: 'Βενζίνη', amount: 30, category: 'transport' },
      { id: 'q4', label: 'Σουβλάκια', amount: 9, category: 'dining' }
    ];
    const paidUpTo = day => {
      const arr = [];
      for (let k = 1; k <= 5; k++) arr.push(FP.addMonths(curYm, -k));
      if (day < today.getDate() || day === today.getDate()) arr.push(curYm);
      return arr;
    };
    p.bills = [
      { id: 'b1', name: 'Ενοίκιο', amount: 380, day: 3, category: 'housing', paid: paidUpTo(3) },
      { id: 'b2', name: 'Κινητό', amount: 15, day: 12, category: 'housing', paid: paidUpTo(12) },
      { id: 'b3', name: 'ΔΕΗ', amount: 62, day: 18, category: 'housing', paid: paidUpTo(1).filter(m => m !== curYm) },
      { id: 'b4', name: 'Internet', amount: 30, day: 22, category: 'housing', paid: paidUpTo(22) },
      { id: 'b5', name: 'Netflix', amount: 13.99, day: 26, category: 'fun', paid: paidUpTo(26) }
    ];
    return { profile: p, txs };
  }

  function persist() { FP.safeStorage.set(KEY, db); }
  function names(t) { return t.user === ME ? db.profile.name : (db.profile.partner && db.profile.partner.name) || '?'; }

  return {
    kind: 'demo',
    async init() { db = FP.safeStorage.get(KEY); return db ? { id: ME } : null; },
    async start() { db = db || seed(); persist(); return { id: ME }; },
    async signIn() { return this.start(); },
    async signUp() { return this.start(); },
    async signInGoogle() { return this.start(); },
    async resetPassword() { return true; },
    async signOut() { FP.safeStorage.del(KEY); db = null; },
    async reset() { db = seed(); persist(); },
    async loadAll() {
      return { profile: db.profile, txs: db.txs.map(t => ({ ...t, userName: names(t) })) };
    },
    async addTx(tx) {
      const row = { id: FP.uid(), user: ME, vault: 'personal', note: '', ...tx };
      db.txs.unshift(row); persist();
      return { ...row, userName: names(row) };
    },
    async updateTx(id, patch) {
      const t = db.txs.find(x => x.id === id); Object.assign(t, patch); persist();
      return { ...t, userName: names(t) };
    },
    async deleteTx(id) { db.txs = db.txs.filter(t => t.id !== id); persist(); },
    async restoreTx(tx) { db.txs.push(tx); db.txs.sort((a, b) => b.date.localeCompare(a.date)); persist(); },
    async saveProfile(patch) { Object.assign(db.profile, patch); persist(); return db.profile; },
    async createInvite() { return 'K7Q-2MX'; },
    async joinInvite() { db.profile.partner = { id: PARTNER, name: 'Μαρία' }; db.profile.vaultId = 'demo-vault'; persist(); return db.profile; },
    async leaveVault() { db.profile.partner = null; db.profile.vaultId = null; persist(); },
    async setSplit(my) { db.profile.split = my; persist(); },
    async ai(req) { await new Promise(r => setTimeout(r, 700)); return FP.localAdvisor(req, db); }
  };
};

/* Rule-based answers for demo mode (no network). */
FP.localAdvisor = function (req, db) {
  const p = db.profile, all = db.txs.filter(t => t.vault === 'personal');
  if (req.mode === 'receipt') {
    return { amount: 23.8, date: FP.todayIso(), category: 'groceries', note: 'Lidl (demo)' };
  }
  const ym = FP.ymOf(new Date()), prev = FP.addMonths(ym, -1);
  const cur = FP.A.inMonth(all, ym), pm = FP.A.inMonth(all, prev);
  const inc = FP.A.sum(cur, 'income'), exp = FP.A.sum(cur, 'expense');
  const cats = FP.A.byCategory(cur, 'expense');
  const top = cats.slice(0, 3).map(c => `• ${FP.catName(FP.cat(p, c.id))}: ${FP.money(c.v)}`).join('\n');
  const q = (req.message || '').toLowerCase();
  const el = FP.lang === 'el';
  const day = new Date().getDate();
  const prevSoFar = FP.A.cumulative(all, prev, Math.min(day, FP.daysIn(prev))).slice(-1)[0] || 0;
  if (/σύγκρ|compare|προηγ|last month/.test(q)) {
    const diff = exp - prevSoFar;
    return { reply: el
      ? `Μέχρι τις ${day} του μήνα ξόδεψες ${FP.money(exp)}, ενώ την ίδια περίοδο του προηγούμενου μήνα ${FP.money(prevSoFar)} — ${diff <= 0 ? FP.money(-diff) + ' λιγότερα' : FP.money(diff) + ' περισσότερα'}.\n\nΣτις κατηγορίες:\n${top}`
      : `By day ${day} you've spent ${FP.money(exp)}, versus ${FP.money(prevSoFar)} at the same point last month — ${diff <= 0 ? FP.money(-diff) + ' less' : FP.money(diff) + ' more'}.\n\nTop categories:\n${top}` };
  }
  if (/πού|που |where|most|περισσότερ/.test(q)) {
    const c = cats[0];
    const share = c ? Math.round(c.v / exp * 100) : 0;
    return { reply: el
      ? `Αυτόν τον μήνα τα περισσότερα πάνε σε:\n${top}\n\nΤο ${share}% των εξόδων σου είναι ${c ? FP.catName(FP.cat(p, c.id)).toLowerCase() : ''}.`
      : `This month most of your money goes to:\n${top}\n\n${share}% of your spending is ${c ? FP.catName(FP.cat(p, c.id)).toLowerCase() : ''}.` };
  }
  if (/αποταμ|save|οικονομ/.test(q)) {
    const dining = cats.find(c => c.id === 'dining');
    return { reply: el
      ? `Τρεις ιδέες με βάση τις κινήσεις σου:\n1. Φαγητό & καφές: ${dining ? FP.money(dining.v) : '—'} αυτόν τον μήνα. Αν τα κόψεις κατά ένα τρίτο, κερδίζεις ~${FP.money((dining ? dining.v : 0) / 3, { round: true })}.\n2. Βάλε τον στόχο των ${FP.money(p.goal, { round: true })} σε ξεχωριστό λογαριασμό μόλις μπει ο μισθός.\n3. Έλεγξε τις συνδρομές στους πάγιους — κάθε 10 € τον μήνα είναι 120 € τον χρόνο.`
      : `Three ideas based on your activity:\n1. Eating out: ${dining ? FP.money(dining.v) : '—'} this month. Cutting it by a third saves ~${FP.money((dining ? dining.v : 0) / 3, { round: true })}.\n2. Move your ${FP.money(p.goal, { round: true })} goal to a separate account right after payday.\n3. Review subscriptions in your bills — every €10/month is €120/year.` };
  }
  return { reply: el
    ? `Μέχρι στιγμής αυτόν τον μήνα:\n• Έσοδα: ${FP.money(inc)}\n• Έξοδα: ${FP.money(exp)}\n• Υπόλοιπο: ${FP.money(inc - exp)}\n\nΟι μεγαλύτερες κατηγορίες:\n${top}`
    : `So far this month:\n• Income: ${FP.money(inc)}\n• Expenses: ${FP.money(exp)}\n• Left: ${FP.money(inc - exp)}\n\nBiggest categories:\n${top}` };
};

/* ======================================================================
   SUPABASE STORE
   ====================================================================== */
FP.SupabaseStore = function (cfg) {
  let sb = null, user = null, profile = null, members = {};
  const CACHE = 'fp_cache_v2';

  const toTx = r => ({
    id: r.id, date: r.date, type: r.type, category: r.category, amount: Number(r.amount),
    note: r.note || '', vault: r.vault_id ? 'shared' : 'personal', user: r.user_id,
    userName: members[r.user_id] || (r.user_id === user.id ? profile.name : '?')
  });
  const fromTx = t => {
    const o = {};
    ['date', 'type', 'category', 'note'].forEach(k => { if (t[k] !== undefined) o[k] = t[k]; });
    if (t.amount !== undefined) o.amount = t.amount;
    if (t.vault !== undefined) o.vault_id = t.vault === 'shared' ? profile.vaultId : null;
    return o;
  };
  const must = ({ data, error }) => { if (error) throw error; return data; };

  return {
    kind: 'supabase',
    async init(onRecovery) {
      const mod = await import('https://esm.sh/@supabase/supabase-js@2');
      sb = mod.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
      sb.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY' && onRecovery) onRecovery(); });
      const { data } = await sb.auth.getSession();
      user = data.session ? data.session.user : null;
      return user;
    },
    async signIn(email, password) { user = must(await sb.auth.signInWithPassword({ email, password })).user; return user; },
    async signUp(email, password, name) {
      const d = must(await sb.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: location.origin + location.pathname } }));
      user = d.session ? d.user : null;
      return user; // null => email confirmation needed
    },
    async signInGoogle() { must(await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } })); },
    async resetPassword(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })); return true; },
    async updatePassword(pw) { must(await sb.auth.updateUser({ password: pw })); },
    async signOut() { await sb.auth.signOut(); FP.safeStorage.del(CACHE); user = null; },

    async loadAll() {
      try {
        const p = must(await sb.from('profiles').select('*').eq('id', user.id).single());
        const s = p.settings || {};
        profile = Object.assign(FP.defaultProfile(user.id, p.display_name, user.email), {
          lang: p.lang || 'el', currency: p.currency || 'EUR', theme: p.theme || 'auto',
          goal: Number(p.savings_goal || 0), startBalance: Number(p.starting_balance || 0),
          quick: s.quick || FP.defaultProfile().quick, bills: s.bills || [], customCats: s.customCats || []
        });
        members = { [user.id]: profile.name };
        const mem = must(await sb.from('vault_members').select('vault_id,user_id,display_name,share'));
        const mine = mem.find(m => m.user_id === user.id);
        profile.vaultId = mine ? mine.vault_id : null;
        profile.split = mine ? mine.share : 50;
        const other = mem.find(m => mine && m.vault_id === mine.vault_id && m.user_id !== user.id);
        profile.partner = other ? { id: other.user_id, name: other.display_name } : null;
        mem.forEach(m => { members[m.user_id] = m.display_name; });
        const rows = must(await sb.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(5000));
        const out = { profile, txs: rows.map(toTx) };
        FP.safeStorage.set(CACHE, out);
        return out;
      } catch (e) {
        const c = FP.safeStorage.get(CACHE);
        if (c && !navigator.onLine) { profile = c.profile; c.offline = true; return c; }
        throw e;
      }
    },
    async addTx(tx) { return toTx(must(await sb.from('transactions').insert(fromTx(tx)).select().single())); },
    async updateTx(id, patch) { return toTx(must(await sb.from('transactions').update(fromTx(patch)).eq('id', id).select().single())); },
    async deleteTx(id) { must(await sb.from('transactions').delete().eq('id', id)); },
    async restoreTx(tx) { return this.addTx(tx); },
    async saveProfile(patch) {
      Object.assign(profile, patch);
      must(await sb.from('profiles').update({
        display_name: profile.name, lang: profile.lang, currency: profile.currency, theme: profile.theme,
        savings_goal: profile.goal, starting_balance: profile.startBalance,
        settings: { quick: profile.quick, bills: profile.bills, customCats: profile.customCats }
      }).eq('id', user.id));
      return profile;
    },
    async createInvite() { return must(await sb.rpc('create_vault_invite')); },
    async joinInvite(code) { must(await sb.rpc('join_vault', { invite: code.trim().toUpperCase() })); return (await this.loadAll()).profile; },
    async leaveVault() { must(await sb.rpc('leave_vault')); },
    async setSplit(my) { must(await sb.rpc('set_vault_split', { my_share: my })); profile.split = my; },
    async ai(req) {
      const { data, error } = await sb.functions.invoke('ai', { body: { ...req, lang: FP.lang } });
      if (error) throw error;
      return data;
    }
  };
};
