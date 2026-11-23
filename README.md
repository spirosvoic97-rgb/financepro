# FinancePRO 2.0

Εφαρμογή προσωπικών οικονομικών (PWA): έσοδα/έξοδα, πάγιοι λογαριασμοί, στόχος αποταμίευσης,
κοινό ταμείο με σύντροφο, AI βοηθός και σάρωση αποδείξεων. Χωρίς build step — καθαρό HTML/CSS/JS.

## Δομή
```
index.html            κέλυφος εφαρμογής
config.js             στοιχεία Supabase (κενά = demo mode)
css/app.css           design system (light/dark)
js/i18n.js            ελληνικά / αγγλικά
js/data.js            κατηγορίες, μορφοποίηση, υπολογισμοί
js/charts.js          SVG γραφήματα + εικονίδια
js/stores.js          DemoStore (browser) & SupabaseStore
js/app.js             οθόνες & αλληλεπίδραση
sw.js                 offline cache του κελύφους
supabase/schema.sql   πίνακες + row-level security + RPC κοινού ταμείου
supabase/functions/ai Edge Function για chat & σκάνερ (OpenAI → Gemini fallback)
```

## Τοπικά
`python3 -m http.server` στον φάκελο και άνοιξε http://localhost:8000 — τρέχει σε demo mode.

## Σύνδεση με Supabase
1. Νέο project στο supabase.com → SQL Editor → τρέξε `supabase/schema.sql`.
2. Authentication → Providers: Email (και Google αν θες). Στο URL Configuration βάλε το URL της εφαρμογής.
3. `supabase functions deploy ai` και `supabase secrets set OPENAI_API_KEY=... GEMINI_API_KEY=...`
4. Συμπλήρωσε `config.js` με το Project URL και το anon key.

## Play Store (TWA)
Το `.well-known/assetlinks.json` πρέπει να σερβίρεται στη **ρίζα του domain**
(π.χ. `https://<user>.github.io/.well-known/assetlinks.json`). Το package μένει `com.voic.financeapp`,
οπότε το νέο AAB ανεβαίνει ως update στο ίδιο listing.
