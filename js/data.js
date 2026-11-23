/* Categories, formatting and the money maths (pure functions, no DOM). */
window.FP = window.FP || {};

FP.DEFAULT_CATEGORIES = [
  // expenses
  { id: 'groceries', type: 'expense', emoji: '🛒', color: '#2F9E6E', el: 'Σούπερ μάρκετ', en: 'Groceries' },
  { id: 'housing', type: 'expense', emoji: '🏠', color: '#4F6BD8', el: 'Σπίτι & λογαριασμοί', en: 'Home & bills' },
  { id: 'transport', type: 'expense', emoji: '⛽', color: '#E08A1E', el: 'Μετακινήσεις', en: 'Transport' },
  { id: 'dining', type: 'expense', emoji: '☕', color: '#C9572F', el: 'Φαγητό & καφές', en: 'Eating out' },
  { id: 'fun', type: 'expense', emoji: '🎬', color: '#9B51C9', el: 'Διασκέδαση & ταξίδια', en: 'Fun & travel' },
  { id: 'shopping', type: 'expense', emoji: '🛍️', color: '#D2497F', el: 'Αγορές', en: 'Shopping' },
  { id: 'health', type: 'expense', emoji: '💊', color: '#1FA3B5', el: 'Υγεία', en: 'Health' },
  { id: 'other_exp', type: 'expense', emoji: '📦', color: '#7D8492', el: 'Άλλα έξοδα', en: 'Other' },
  // income
  { id: 'salary', type: 'income', emoji: '💼', color: '#18865A', el: 'Μισθός', en: 'Salary' },
  { id: 'freelance', type: 'income', emoji: '🧾', color: '#2B8FB8', el: 'Ιδιαίτερα / Freelance', en: 'Freelance' },
  { id: 'invest', type: 'income', emoji: '📈', color: '#5A63D6', el: 'Επενδύσεις', en: 'Investments' },
  { id: 'refund', type: 'income', emoji: '↩️', color: '#8A7A2E', el: 'Επιστροφές', en: 'Refunds' },
  { id: 'gifts', type: 'income', emoji: '🎁', color: '#C95A9A', el: 'Δώρα / Επιδόματα', en: 'Gifts & benefits' },
  { id: 'other_inc', type: 'income', emoji: '➕', color: '#6C7A89', el: 'Άλλα έσοδα', en: 'Other income' }
];
FP.CUSTOM_COLORS = ['#3D8B7D', '#B8663A', '#6A5ACD', '#A0522D', '#2E86AB', '#9C6644', '#5C946E', '#C05746'];
FP.SETTLE_CAT = { id: 'settle', type: 'settlement', emoji: '🤝', color: '#4F55C9', el: 'Εξόφληση', en: 'Settlement' };

FP.allCategories = (profile) => FP.DEFAULT_CATEGORIES.concat((profile && profile.customCats) || []);
FP.cat = (profile, id) => {
  if (id === 'settle_paid' || id === 'settle_received') return FP.SETTLE_CAT;
  return FP.allCategories(profile).find(c => c.id === id) ||
    { id, type: 'expense', emoji: '•', color: '#7D8492', el: id, en: id };
};
FP.catName = (c) => (FP.lang === 'en' ? c.en : c.el) || c.el || c.en;

/* ---------- dates ---------- */
FP.pad = n => String(n).padStart(2, '0');
FP.iso = d => d.getFullYear() + '-' + FP.pad(d.getMonth() + 1) + '-' + FP.pad(d.getDate());
FP.todayIso = () => FP.iso(new Date());
FP.parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
FP.ym = s => s.slice(0, 7);
FP.ymOf = d => d.getFullYear() + '-' + FP.pad(d.getMonth() + 1);
FP.addMonths = (ym, k) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return FP.ymOf(d); };
FP.daysIn = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
FP.monthIdx = ym => Number(ym.split('-')[1]) - 1;

FP.dayLabel = s => {
  const today = FP.todayIso();
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (s === today) return FP.t('today');
  if (s === FP.iso(y)) return FP.t('yesterday');
  const d = FP.parse(s);
  const loc = FP.lang === 'el' ? 'el-GR' : 'en-GB';
  return d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
};
FP.shortDate = s => {
  const d = FP.parse(s);
  return d.getDate() + ' ' + FP.monthName(d.getMonth(), 'short');
};

/* ---------- money ---------- */
FP.currency = 'EUR';
FP.money = (v, opts) => {
  opts = opts || {};
  const loc = FP.lang === 'el' ? 'el-GR' : 'en-GB';
  const f = new Intl.NumberFormat(loc, {
    style: 'currency', currency: FP.currency,
    minimumFractionDigits: opts.round ? 0 : 2, maximumFractionDigits: opts.round ? 0 : 2
  });
  let s = f.format(Math.abs(v));
  if (opts.sign) s = (v < 0 ? '−' : '+') + s;
  else if (v < 0) s = '−' + s;
  return s;
};
FP.moneyParts = v => {
  // splits into whole + decimals for the big hero number
  const s = FP.money(v);
  const sep = FP.lang === 'el' ? ',' : '.';
  const i = s.lastIndexOf(sep);
  if (i < 0) return { main: s, dec: '' };
  // keep currency symbol position: el => "1.234,56 €", en => "€1,234.56"
  const m = s.slice(i).match(/^(.\d{2})(.*)$/);
  return { main: s.slice(0, i), dec: m ? m[1] : s.slice(i), tail: m ? m[2] : '' };
};
FP.round2 = v => Math.round(v * 100) / 100;

/* ---------- analytics ---------- */
FP.A = {
  inMonth: (txs, ym) => txs.filter(t => t.date.slice(0, 7) === ym),
  sum: (txs, type) => FP.round2(txs.filter(t => t.type === type).reduce((a, t) => a + t.amount, 0)),

  /** cumulative daily expense array for a month (index 0 = day 1) */
  cumulative: (txs, ym, uptoDay) => {
    const n = uptoDay || FP.daysIn(ym);
    const daily = new Array(FP.daysIn(ym)).fill(0);
    txs.forEach(t => { if (t.type === 'expense' && t.date.slice(0, 7) === ym) daily[Number(t.date.slice(8)) - 1] += t.amount; });
    const out = []; let acc = 0;
    for (let i = 0; i < n; i++) { acc += daily[i]; out.push(FP.round2(acc)); }
    return out;
  },

  byCategory: (txs, type) => {
    const m = {};
    txs.filter(t => t.type === type).forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).map(([id, v]) => ({ id, v: FP.round2(v) })).sort((a, b) => b.v - a.v);
  },

  lastMonths: (txs, ym, n) => {
    const out = [];
    for (let k = n - 1; k >= 0; k--) {
      const m = FP.addMonths(ym, -k);
      const mt = FP.A.inMonth(txs, m);
      out.push({ ym: m, income: FP.A.sum(mt, 'income'), expense: FP.A.sum(mt, 'expense') });
    }
    return out;
  },

  /** bills not yet paid this month, with due status */
  billsStatus: (bills, ym, todayDay) => (bills || []).map(b => ({
    ...b,
    isPaid: (b.paid || []).includes(ym),
    late: !(b.paid || []).includes(ym) && b.day < todayDay,
    isToday: b.day === todayDay
  })).sort((a, b) => (a.isPaid - b.isPaid) || (a.day - b.day)),

  /** "safe to spend per day" à la YNAB: what is left after unpaid bills + savings goal, over remaining days */
  safeDaily: (income, expense, unpaidBills, goal, daysLeft) => {
    const free = income - expense - unpaidBills - (goal || 0);
    return { free: FP.round2(free), perDay: daysLeft > 0 ? FP.round2(Math.max(0, free) / daysLeft) : 0 };
  },

  /**
   * Shared vault balance between me and partner.
   * pos > 0 => partner owes me. ratio = my share of shared expenses (0..1).
   * Settlement rows: category settle_paid (recorder paid the other) / settle_received (recorder received).
   */
  sharedBalance: (txs, me, partner, ratio) => {
    let paidMe = 0, paidThem = 0, adj = 0;
    txs.forEach(t => {
      if (t.vault !== 'shared') return;
      if (t.type === 'expense') {
        if (t.user === me) paidMe += t.amount; else if (t.user === partner) paidThem += t.amount;
      } else if (t.type === 'settlement') {
        const sign = t.category === 'settle_paid' ? 1 : -1; // recorder paid => recorder's position rises
        adj += (t.user === me ? sign : -sign) * t.amount;
      }
    });
    const total = paidMe + paidThem;
    const pos = FP.round2(paidMe - total * ratio + adj);
    return { paidMe: FP.round2(paidMe), paidThem: FP.round2(paidThem), total: FP.round2(total), pos };
  },

  balanceAll: (txs, start) => FP.round2((start || 0) + FP.A.sum(txs, 'income') - FP.A.sum(txs, 'expense'))
};

FP.uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));

FP.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

FP.toCsv = (txs, profile) => {
  const head = ['date', 'type', 'category', 'amount', 'note', 'vault', 'user'];
  const rows = txs.map(t => [t.date, t.type, FP.catName(FP.cat(profile, t.category)), t.amount.toFixed(2), t.note || '', t.vault, t.userName || t.user]);
  return [head].concat(rows).map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
};
