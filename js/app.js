/* FinancePRO v2 — UI */
(function () {
  const t = FP.t, I = FP.ICON, esc = FP.esc, money = FP.money;
  const $app = document.getElementById('app');
  const $layer = document.getElementById('layer');
  const $toast = document.getElementById('toast');

  const S = {
    store: null, user: null, profile: null, txs: [], offline: false,
    view: 'home', vault: 'personal',
    filters: { q: '', type: 'all' }, txLimit: 120,
    insightsYm: FP.ymOf(new Date()),
    chat: [], chatBusy: false,
    auth: { mode: 'signin', err: '', info: '', busy: false },
    sheet: null, form: null
  };

  /* ---------------------------------------------------------- helpers */
  const me = () => S.profile.id;
  const nowYm = () => FP.ymOf(new Date());
  const personalTxs = () => S.txs.filter(x => x.vault === 'personal' && x.user === me());
  const sharedTxs = () => S.txs.filter(x => x.vault === 'shared');
  const vaultTxs = () => (S.vault === 'shared' ? sharedTxs() : personalTxs());
  const catOf = id => FP.cat(S.profile, id);
  const partnerName = () => (S.profile.partner ? S.profile.partner.name : '');
  const initial = n => (n || '?').trim().charAt(0).toUpperCase();
  const tint = c => `background:${c}1f`; // ~12% alpha

  function applyTheme() {
    const pref = S.profile ? S.profile.theme : 'auto';
    const dark = pref === 'dark' || (pref === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#0C0E11' : '#F3F2EE');
  }
  function applyLocale() {
    FP.lang = (S.profile && S.profile.lang) || FP.lang;
    FP.currency = (S.profile && S.profile.currency) || 'EUR';
    document.documentElement.lang = FP.lang;
  }

  let toastTimer = null;
  function toast(msg, action) {
    clearTimeout(toastTimer);
    $toast.innerHTML = `<div class="toast" role="status"><span>${msg}</span>${action ? `<button data-act="toastAction">${esc(action.label)}</button>` : ''}</div>`;
    S.toastAction = action ? action.fn : null;
    toastTimer = setTimeout(() => { $toast.innerHTML = ''; S.toastAction = null; }, action ? 5000 : 2600);
  }

  function fail(e) {
    console.error(e);
    toast(esc((e && e.message) || t('errGeneric')));
  }

  /* ---------------------------------------------------------- boot */
  async function boot() {
    const cfg = window.FINANCEPRO_CONFIG || {};
    const useSb = cfg.supabaseUrl && cfg.supabaseAnonKey;
    FP.lang = (FP.safeStorage.get('fp_lang')) || ((navigator.language || 'el').startsWith('el') ? 'el' : 'el');
    S.store = useSb ? FP.SupabaseStore({ url: cfg.supabaseUrl, anonKey: cfg.supabaseAnonKey }) : FP.DemoStore();
    applyTheme();
    try {
      S.user = await S.store.init(() => openSheet('newPassword'));
    } catch (e) { fail(e); }
    if (S.user) await loadData(); else render();
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    window.addEventListener('online', () => { if (S.user) loadData(); });
  }

  async function loadData() {
    try {
      const d = await S.store.loadAll();
      S.profile = d.profile; S.txs = d.txs; S.offline = !!d.offline;
      applyLocale(); applyTheme(); render();
    } catch (e) { fail(e); render(); }
  }

  /* ---------------------------------------------------------- render */
  function render() {
    if (!S.user || !S.profile) { $app.innerHTML = viewAuth(); return; }
    const views = { home: viewHome, tx: viewTx, insights: viewInsights, ai: viewAI, settings: viewSettings };
    $app.innerHTML = `<main class="screen" id="screen">${S.offline ? `<div class="notice">${t('offline')}</div>` : ''}${views[S.view]()}</main>${S.view === 'settings' ? '' : nav()}${S.view === 'ai' ? composer() : ''}`;
    if (S.view === 'ai') { const c = document.getElementById('chatEnd'); if (c) c.scrollIntoView({ block: 'end' }); }
  }

  function nav() {
    const b = (v, icon, label) => `<button data-act="go" data-v="${v}" ${S.view === v ? 'aria-current="page"' : ''}>${I[icon]}<span>${label}</span></button>`;
    return `<nav class="nav" aria-label="Main">
      ${b('home', 'home', t('navHome'))}${b('tx', 'list', t('navTx'))}
      <div><button class="fab" data-act="newTx" aria-label="${t('add')}">${I.plus}</button></div>
      ${b('insights', 'chart', t('navInsights'))}${b('ai', 'spark', t('navAI'))}
    </nav>`;
  }

  function vaultSwitch() {
    return `<div class="seg" role="group">
      <button data-act="vault" data-v="personal" aria-pressed="${S.vault === 'personal'}">${t('personal')}</button>
      <button class="shared" data-act="vault" data-v="shared" aria-pressed="${S.vault === 'shared'}">${t('shared')}</button>
    </div>`;
  }

  function txItem(x, opts) {
    const c = catOf(x.category);
    const sign = x.type === 'income' ? 1 : x.type === 'expense' ? -1 : 0;
    const shared = x.vault === 'shared';
    const who = shared ? `<span class="who" title="${esc(x.userName)}">${esc(initial(x.user === me() ? S.profile.name : x.userName))}</span>` : '';
    let sub = FP.catName(c);
    if (x.type === 'settlement') {
      const recorder = x.user === me() ? t('you') : x.userName;
      const other = x.user === me() ? partnerName() : t('you');
      sub = x.category === 'settle_paid' ? `${recorder} → ${other}` : `${other} → ${recorder}`;
    } else if (shared) sub += ' · ' + (x.user === me() ? t('you') : esc(x.userName));
    if (opts && opts.withDate) sub = FP.shortDate(x.date) + ' · ' + sub;
    const title = x.note || FP.catName(c);
    return `<button class="item" data-act="editTx" data-id="${x.id}">
      <span class="cat-ic" style="${tint(c.color)}">${c.emoji}${who}</span>
      <span class="mid"><div class="t">${esc(title)}</div><div class="d">${esc(sub)}</div></span>
      <span class="amt num ${sign > 0 ? 'pos' : ''}">${sign ? money(sign * x.amount, { sign: sign > 0 }) : money(x.amount)}</span>
    </button>`;
  }

  function emptyState(icon, a, b) {
    return `<div class="empty"><div class="e">${icon}</div><div><b>${a}</b></div>${b ? `<div class="faint">${b}</div>` : ''}</div>`;
  }

  /* ---------------------------------------------------------- HOME */
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? t('goodMorning') : h >= 18 ? t('goodEvening') : t('hello');
  }
  function topbar(title, sub) {
    return `<header class="topbar">
      <div><div class="sub">${sub}</div><h1>${title}</h1></div>
      <button class="avatar" data-act="go" data-v="settings" aria-label="${t('settings')}">${esc(initial(S.profile.name))}</button>
    </header>`;
  }

  function viewHome() {
    const today = new Date();
    const dateStr = today.toLocaleDateString(FP.lang === 'el' ? 'el-GR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    let html = topbar(greeting(), dateStr) + `<div style="margin:4px 0 14px">${vaultSwitch()}</div>`;
    html += S.vault === 'shared' ? homeShared() : homePersonal();
    return html;
  }

  function homePersonal() {
    const ym = nowYm(), prevYm = FP.addMonths(ym, -1), day = new Date().getDate();
    const all = personalTxs(), cur = FP.A.inMonth(all, ym);
    const inc = FP.A.sum(cur, 'income'), exp = FP.A.sum(cur, 'expense'), left = FP.round2(inc - exp);
    const parts = FP.moneyParts(left);
    const balance = FP.A.balanceAll(all, S.profile.startBalance);

    // pace
    const dim = FP.daysIn(ym);
    const curCum = FP.A.cumulative(all, ym, day);
    const prevCum = FP.A.cumulative(all, prevYm);
    const prevSoFar = prevCum[Math.min(day, prevCum.length) - 1] || 0;
    const nowSoFar = curCum[curCum.length - 1] || 0;
    const pm = FP.monthName(FP.monthIdx(prevYm), 'acc');
    let call = '';
    if (prevSoFar > 0) {
      const pct = Math.round((nowSoFar - prevSoFar) / prevSoFar * 100);
      call = Math.abs(pct) < 3 ? t('paceSame', { month: pm }) : pct < 0 ? t('paceLess', { pct: -pct, month: pm }) : t('paceMore', { pct, month: pm });
    }

    // bills, safe-to-spend, goal
    const bills = FP.A.billsStatus(S.profile.bills, ym, day);
    const unpaid = bills.filter(b => !b.isPaid).reduce((a, b) => a + b.amount, 0);
    const daysLeft = dim - day + 1;
    const safe = FP.A.safeDaily(inc, exp, unpaid, S.profile.goal, daysLeft);
    const goal = S.profile.goal || 0;
    const goalPct = goal > 0 ? Math.max(0, left) / goal : 0;

    let h = `<section class="card hero">
      <div class="label" style="display:flex;justify-content:space-between;gap:8px"><span>${t('leftThisMonth', { month: FP.monthName(FP.monthIdx(ym), 'gen') })}</span><span class="num">${t('balance')} <b style="color:var(--ink)">${money(balance, { round: Math.abs(balance) >= 10000 })}</b></span></div>
      <div class="big num ${left < 0 ? 'neg' : ''}">${left < 0 ? '−' : ''}${esc(parts.main.replace('−', ''))}<span class="dec">${esc(parts.dec)}${esc(parts.tail || '')}</span></div>
      <div class="hero-stats">
        <div class="stat"><div class="k"><span class="dot" style="background:var(--pos)"></span>${t('income')}</div><div class="v num">${money(inc)}</div></div>
        <div class="stat"><div class="k"><span class="dot" style="background:var(--neg)"></span>${t('expenses')}</div><div class="v num">${money(exp)}</div></div>
      </div>
    </section>`;

    h += `<section class="card">
      <div class="card-head"><h3>${t('pace')}</h3><span class="faint num" style="font-size:13px">${money(nowSoFar)}</span></div>
      ${call ? `<p class="callout">${call}</p>` : ''}
      <div class="chart-wrap">${FP.Charts.pace(curCum, prevCum, dim, { label: t('pace') })}</div>
      <div class="legend"><span><i style="background:var(--accent)"></i>${FP.monthName(FP.monthIdx(ym))}</span><span><i style="background:var(--ink-3)"></i>${FP.monthName(FP.monthIdx(prevYm))}</span></div>
    </section>`;

    h += `<div class="row2">
      <section class="card metric">
        <div class="k">${t('safeDaily')}</div>
        <div class="v num ${safe.free <= 0 ? 'neg' : ''}">${safe.free <= 0 ? t('safeNone') : money(safe.perDay, { round: safe.perDay >= 100 })}</div>
        <div class="s">${t('safeSub', { days: daysLeft })}</div>
      </section>
      <button class="card metric ring" data-act="editField" data-k="goal" style="text-align:left">
        ${FP.Charts.ring(goalPct, 52, goalPct >= 1 ? 'var(--pos)' : 'var(--accent)')}
        <div><div class="k">${t('goal')}</div><div class="v num" style="font-size:17px">${goal ? Math.round(Math.min(goalPct, 9.99) * 100) + '%' : '—'}</div>
        <div class="s">${goal ? t('goalOf', { goal: money(goal, { round: true }) }) : t('noGoal')}</div></div>
      </button>
    </div>`;

    // quick add
    h += `<div class="section-label">${t('quickAdd')}</div><div class="chips">
      ${S.profile.quick.map(q => { const c = catOf(q.category); return `<button class="chip" data-act="quick" data-id="${q.id}"><span class="e">${c.emoji}</span>${esc(q.label)} <span class="a num">${money(q.amount)}</span></button>`; }).join('')}
      <button class="chip ghost" data-act="go" data-v="settings" data-anchor="quick">${t('edit')}</button>
    </div>`;

    // bills
    h += `<section class="card" style="margin-top:10px">
      <div class="card-head"><h3>${t('bills')}</h3><button class="link" data-act="addBill">+ ${t('addBill')}</button></div>
      ${bills.length ? bills.map(b => {
        const c = catOf(b.category);
        const dueTxt = b.isPaid ? t('paid') : b.isToday ? t('dueToday') : b.late ? t('overdue', { day: b.day + '/' + (FP.monthIdx(ym) + 1) }) : t('due', { day: b.day + '/' + (FP.monthIdx(ym) + 1) });
        return `<div class="bill">
          <span class="cat-ic" style="${tint(c.color)}">${c.emoji}</span>
          <div class="mid" style="flex:1;min-width:0"><div class="t" style="font-weight:600">${esc(b.name)}</div><div class="due ${b.late ? 'late' : ''}">${dueTxt}</div></div>
          <span class="num" style="font-weight:650;margin-right:6px">${money(b.amount)}</span>
          ${b.isPaid ? `<span class="pill-btn done">✓</span>` : `<button class="pill-btn" data-act="payBill" data-id="${b.id}">${t('pay')}</button>`}
        </div>`;
      }).join('') : `<div class="faint" style="font-size:14px">${t('billsEmpty')}</div>`}
    </section>`;

    // recent
    const recent = all.slice(0, 6);
    h += `<section class="card">
      <div class="card-head"><h3>${t('recent')}</h3><button class="link" data-act="go" data-v="tx">${t('seeAll')}</button></div>
      ${recent.length ? `<div class="list">${recent.map(x => txItem(x, { withDate: true })).join('')}</div>` : emptyState('🧾', t('noTx'), t('noTxHint'))}
    </section>`;
    return h;
  }

  function homeShared() {
    if (!S.profile.partner) {
      return `<section class="card hero shared-hero">
        <div style="font-size:30px;margin-bottom:8px">👥</div>
        <h3 style="font-size:18px;margin-bottom:6px">${t('noPartner')}</h3>
        <p class="muted" style="margin:0 0 16px">${t('noPartnerSub')}</p>
        <div class="btn-row"><button class="btn" data-act="invite">${t('invite')}</button><button class="btn outline" data-act="join">${t('joinCode')}</button></div>
      </section>`;
    }
    const ym = nowYm(), all = sharedTxs(), cur = FP.A.inMonth(all, ym);
    const exp = FP.A.sum(cur, 'expense');
    const mineM = FP.round2(cur.filter(x => x.type === 'expense' && x.user === me()).reduce((a, x) => a + x.amount, 0));
    const ratio = (S.profile.split || 50) / 100;
    const bal = FP.A.sharedBalance(all, me(), S.profile.partner.id, ratio);
    const pn = partnerName();
    const parts = FP.moneyParts(exp);
    let owe;
    if (Math.abs(bal.pos) < 0.01) owe = `<div style="font-size:20px;font-weight:700">✅ ${t('settled')}</div>`;
    else owe = `<div class="faint" style="font-size:13px">${bal.pos > 0 ? t('owesYou', { name: esc(pn) }) : t('youOwe', { name: esc(pn) })}</div>
      <div class="num" style="font-size:30px;font-weight:700;letter-spacing:-.02em;color:${bal.pos > 0 ? 'var(--pos)' : 'var(--neg)'}">${money(Math.abs(bal.pos))}</div>`;

    let h = `<section class="card hero shared-hero">
      <div class="label">${t('sharedSpent', { month: FP.monthName(FP.monthIdx(ym), 'gen') })}</div>
      <div class="big num">${esc(parts.main)}<span class="dec">${esc(parts.dec)}${esc(parts.tail || '')}</span></div>
      <div class="hero-stats">
        <div class="stat"><div class="k">${t('paidYou')}</div><div class="v num">${money(mineM)}</div></div>
        <div class="stat"><div class="k">${t('paidThem', { name: esc(pn) })}</div><div class="v num">${money(FP.round2(exp - mineM))}</div></div>
      </div>
    </section>`;

    h += `<section class="card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div style="display:flex">
          <span class="avatar" style="width:44px;height:44px;box-shadow:none;background:var(--accent-soft);color:var(--accent)">${esc(initial(S.profile.name))}</span>
          <span class="avatar" style="width:44px;height:44px;box-shadow:none;margin-left:-10px;background:var(--shared-soft);color:var(--shared);border:2px solid var(--surface)">${esc(initial(pn))}</span>
        </div>
        <div style="flex:1">${owe}</div>
      </div>
      ${Math.abs(bal.pos) >= 0.01 ? `<button class="btn accent" data-act="settle">🤝 ${t('settleUp')}</button>` : ''}
      <div style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px" class="muted">
          <span>${t('split')}</span><span class="num" id="splitLbl">${t('you')} ${S.profile.split}% · ${esc(pn)} ${100 - S.profile.split}%</span></div>
        <input type="range" min="0" max="100" step="5" value="${S.profile.split}" data-inp="split" aria-label="${t('split')}" style="width:100%;accent-color:var(--shared)">
      </div>
    </section>`;

    const recent = all.slice(0, 8);
    h += `<section class="card">
      <div class="card-head"><h3>${t('recent')}</h3><button class="link" data-act="go" data-v="tx">${t('seeAll')}</button></div>
      ${recent.length ? `<div class="list">${recent.map(x => txItem(x, { withDate: true })).join('')}</div>` : emptyState('🧾', t('noTx'), t('noTxHint'))}
    </section>`;
    return h;
  }

  /* ---------------------------------------------------------- TRANSACTIONS */
  function viewTx() {
    const f = S.filters, q = f.q.trim().toLowerCase();
    let list = vaultTxs();
    if (f.type !== 'all') list = list.filter(x => x.type === f.type);
    if (q) list = list.filter(x => (x.note || '').toLowerCase().includes(q) || FP.catName(catOf(x.category)).toLowerCase().includes(q) || String(x.amount).includes(q));
    const total = list.length;
    const shown = list.slice(0, S.txLimit);
    const groups = [];
    shown.forEach(x => {
      let g = groups[groups.length - 1];
      if (!g || g.date !== x.date) { g = { date: x.date, items: [], net: 0 }; groups.push(g); }
      g.items.push(x);
      g.net += x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0;
    });
    const chip = (v, l) => `<button class="chip ${f.type === v ? 'on' : ''}" data-act="ftype" data-v="${v}">${l}</button>`;
    return `<header class="topbar"><h1>${t('navTx')}</h1>${vaultSwitch()}</header>
      <label class="search">${I.search}<input type="search" placeholder="${t('search')}" value="${esc(f.q)}" data-inp="q" aria-label="${t('search')}"></label>
      <div class="chips">${chip('all', t('all'))}${chip('expense', t('filterExpense'))}${chip('income', t('filterIncome'))}</div>
      <div class="faint" style="font-size:13px;margin:6px 4px 0">${t('resultsCount', { n: total })}</div>
      ${groups.length ? groups.map(g => `<div class="day-head"><span>${esc(FP.dayLabel(g.date))}</span><span class="num">${money(FP.round2(g.net), { sign: g.net > 0 })}</span></div>
        <section class="card day-group"><div class="list">${g.items.map(x => txItem(x)).join('')}</div></section>`).join('')
        : `<section class="card">${emptyState('🔎', q || f.type !== 'all' ? t('noResults') : t('noTx'), q ? '' : t('noTxHint'))}</section>`}
      ${total > S.txLimit ? `<button class="btn soft" data-act="more">+${total - S.txLimit}</button>` : ''}`;
  }

  /* ---------------------------------------------------------- INSIGHTS */
  function viewInsights() {
    const ym = S.insightsYm, prev = FP.addMonths(ym, -1), all = vaultTxs();
    const cur = FP.A.inMonth(all, ym), pm = FP.A.inMonth(all, prev);
    const inc = FP.A.sum(cur, 'income'), exp = FP.A.sum(cur, 'expense');
    const cats = FP.A.byCategory(cur, 'expense'), prevCats = FP.A.byCategory(pm, 'expense');
    const isNow = ym === nowYm();
    const days = isNow ? new Date().getDate() : FP.daysIn(ym);
    const rate = inc > 0 ? Math.round((inc - exp) / inc * 100) : null;
    const biggest = cur.filter(x => x.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
    const segs = cats.map(c => ({ v: c.v, color: catOf(c.id).color }));
    const months = FP.A.lastMonths(all, ym, 6);

    let h = `<header class="topbar"><h1>${t('insights')}</h1>${vaultSwitch()}</header>
      <div class="month-nav">
        <button data-act="month" data-d="-1" aria-label="prev">${I.back}</button>
        <strong>${FP.monthName(FP.monthIdx(ym))} ${ym.slice(0, 4)}</strong>
        <button data-act="month" data-d="1" ${isNow ? 'disabled' : ''} aria-label="next">${I.next}</button>
      </div>
      <div class="row2">
        <section class="card metric"><div class="k">${t('income')}</div><div class="v num pos">${money(inc, { round: inc >= 1000 })}</div><div class="s">${S.vault === 'shared' ? '' : (rate === null ? '—' : t('savingsRate') + ' ' + rate + '%')}</div></section>
        <section class="card metric"><div class="k">${t('expenses')}</div><div class="v num">${money(exp, { round: exp >= 1000 })}</div><div class="s">${t('avgDaily')} ${money(days ? exp / days : 0)}</div></section>
      </div>`;

    h += `<section class="card"><div class="card-head"><h3>${t('byCategory')}</h3></div>`;
    if (!cats.length) h += emptyState('📊', t('noData'));
    else {
      h += `<div class="donut-wrap">${FP.Charts.donut(segs, 132, money(exp, { round: true }), t('expenses'))}
        <div class="donut-legend">${cats.slice(0, 5).map(c => { const k = catOf(c.id); return `<div><span class="dot" style="background:${k.color}"></span><span>${esc(FP.catName(k))}</span><b class="num">${Math.round(c.v / exp * 100)}%</b></div>`; }).join('')}</div></div>
        <div style="margin-top:10px">${cats.map(c => {
          const k = catOf(c.id), p = prevCats.find(x => x.id === c.id), pv = p ? p.v : 0;
          const d = pv ? Math.round((c.v - pv) / pv * 100) : null;
          return `<div class="cbar"><span class="cat-ic" style="${tint(k.color)}">${k.emoji}</span>
            <span class="n">${esc(FP.catName(k))}</span><span class="v num">${money(c.v)}</span>
            <span class="track"><i style="width:${(c.v / cats[0].v * 100).toFixed(1)}%;background:${k.color}"></i></span>
            <span class="delta num ${d === null ? 'faint' : d > 0 ? 'neg' : 'pos'}">${d === null ? '—' : (d > 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% ' + t('vsPrev')}</span></div>`;
        }).join('')}</div>`;
    }
    h += `</section>`;

    h += `<section class="card"><div class="card-head"><h3>${t('sixMonths')}</h3></div>
      <div class="chart-wrap">${FP.Charts.bars(months, ym)}</div>
      <div class="legend"><span><span class="dot" style="background:var(--pos)"></span>${t('income')}</span><span><span class="dot" style="background:var(--neg)"></span>${t('expenses')}</span></div>
    </section>`;

    if (biggest) h += `<section class="card"><div class="card-head"><h3>${t('biggest')}</h3></div><div class="list">${txItem(biggest, { withDate: true })}</div></section>`;
    return h;
  }

  /* ---------------------------------------------------------- AI */
  function viewAI() {
    const demo = S.store.kind === 'demo';
    let h = `<header class="topbar"><h1>${t('navAI')}</h1>${S.chat.length ? `<button class="chip ghost" data-act="clearChat">${t('clearChat')}</button>` : ''}</header>`;
    if (!S.chat.length) {
      h += `<div class="ai-intro"><div class="orb">${I.spark}</div><h2>${t('aiTitle')}</h2><p class="muted" style="margin:0">${t('aiLead')}</p></div>
        ${demo ? `<div class="notice ai">ℹ️ <span>${t('aiDemo')}</span></div>` : ''}
        <div class="suggest">
          ${[['📅', 'aiS1'], ['🍩', 'aiS2'], ['🐷', 'aiS3'], ['↔️', 'aiS4']].map(([e, k]) => `<button data-act="ask" data-q="${esc(t(k))}"><span>${e}</span>${t(k)}</button>`).join('')}
          <button data-act="newTx" data-scan="1"><span>📸</span>${t('scan')}</button>
        </div>`;
    } else {
      h += `<div class="chat">${S.chat.map(m => `<div class="msg ${m.role}">${m.role === 'bot' ? fmtBot(m.text) : esc(m.text)}</div>`).join('')}
        ${S.chatBusy ? `<div class="msg bot"><span class="typing"><i></i><i></i><i></i></span></div>` : ''}<div id="chatEnd"></div></div>`;
    }
    return h;
  }
  const fmtBot = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  function composer() {
    return `<div class="composer"><form data-form="chat"><input name="q" placeholder="${t('aiAsk')}" autocomplete="off" aria-label="${t('aiAsk')}" ${S.chatBusy ? 'disabled' : ''}><button aria-label="send" ${S.chatBusy ? 'disabled' : ''}>${I.send}</button></form></div>`;
  }
  async function ask(q) {
    if (!q || S.chatBusy) return;
    S.chat.push({ role: 'user', text: q }); S.chatBusy = true; render();
    try {
      const history = S.chat.slice(-8).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
      const r = await S.store.ai({ mode: 'chat', message: q, history, vault: S.vault });
      S.chat.push({ role: 'bot', text: r.reply || t('aiError') });
    } catch (e) { console.error(e); S.chat.push({ role: 'bot', text: t('aiError') }); }
    S.chatBusy = false; render();
  }

  /* ---------------------------------------------------------- SETTINGS */
  function viewSettings() {
    const p = S.profile;
    const row = (ic, l, r, act, extra) => `<button class="srow" ${act ? `data-act="${act}"` : ''} ${extra || ''}><span class="ic">${ic}</span><span class="l">${l}</span><span class="r">${r}${act ? I.chev : ''}</span></button>`;
    const sel = (ic, l, key, opts) => `<label class="srow"><span class="ic">${ic}</span><span class="l">${l}</span><select data-inp="pref" data-k="${key}">${opts.map(([v, n]) => `<option value="${v}" ${p[key] === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
    const custom = p.customCats || [];
    return `<header class="topbar"><button class="icon-btn" data-act="go" data-v="home" aria-label="${t('back')}">${I.back}</button><h1 style="flex:1">${t('settings')}</h1>
      ${S.store.kind === 'demo' ? `<span class="demo-badge">demo</span>` : ''}</header>
      <section class="card" style="display:flex;align-items:center;gap:14px">
        <span class="avatar" style="width:56px;height:56px;font-size:22px;box-shadow:none;background:var(--accent-soft);color:var(--accent)">${esc(initial(p.name))}</span>
        <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:18px">${esc(p.name || '—')}</div><div class="muted" style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.email)}</div></div>
        <button class="chip ghost" data-act="editField" data-k="name">${t('edit')}</button>
      </section>

      <div class="section-label">${t('appearance')}</div>
      <div class="group">
        ${sel('🌗', t('theme'), 'theme', [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')]])}
        ${sel('🌐', t('language'), 'lang', [['el', 'Ελληνικά'], ['en', 'English']])}
        ${sel('💶', t('currency'), 'currency', [['EUR', '€ EUR'], ['USD', '$ USD'], ['GBP', '£ GBP'], ['CHF', 'CHF']])}
      </div>

      <div class="section-label">${t('money')}</div>
      <div class="group">
        ${row('🎯', t('monthlyGoal'), `<span class="num">${money(p.goal, { round: true })}</span>`, 'editField', 'data-k="goal"')}
        ${row('🏦', t('startBalance'), `<span class="num">${money(p.startBalance)}</span>`, 'editField', 'data-k="startBalance"')}
      </div>

      <div class="section-label">${t('sharedHub')}</div>
      <div class="group">
        ${p.partner
          ? row('👥', esc(p.partner.name), `${t('split')} ${p.split}/${100 - p.split}`, null) + row('🚪', `<span class="neg">${t('leaveVault')}</span>`, '', 'leave')
          : row('📨', t('invite'), '', 'invite') + row('🔑', t('joinCode'), '', 'join')}
      </div>

      <div class="section-label" id="quick">${t('quickButtons')}</div>
      <div class="group">
        ${p.quick.map(q => row(catOf(q.category).emoji, esc(q.label), `<span class="num">${money(q.amount)}</span>`, 'editQuick', `data-id="${q.id}"`)).join('')}
        ${row('➕', t('addQuick'), '', 'editQuick', 'data-id=""')}
      </div>

      <div class="section-label">${t('bills')}</div>
      <div class="group">
        ${p.bills.map(b => row(catOf(b.category).emoji, esc(b.name), `<span class="num">${money(b.amount)} · ${b.day}</span>`, 'editBill', `data-id="${b.id}"`)).join('')}
        ${row('➕', t('addBill'), '', 'editBill', 'data-id=""')}
      </div>

      <div class="section-label">${t('categories')}</div>
      <div class="group">
        ${custom.map(c => row(c.emoji, esc(c.el), c.type === 'income' ? t('incomeOne') : t('expense'), 'editCat', `data-id="${c.id}"`)).join('')}
        ${row('➕', t('addCat'), `<span class="faint">${FP.DEFAULT_CATEGORIES.length} + ${custom.length}</span>`, 'editCat', 'data-id=""')}
      </div>

      <div class="section-label">${t('data')}</div>
      <div class="group">${row('⬇️', t('exportCsv'), '', 'csv')}</div>

      <div class="section-label">${t('account')}</div>
      <div class="group">
        ${S.store.kind === 'demo' ? row('♻️', t('demoReset'), '', 'demoReset') : ''}
        ${row('↪️', `<span class="neg">${t('signOut')}</span>`, '', 'signOut')}
      </div>
      <p class="faint" style="text-align:center;font-size:12px;margin-top:20px">${t('version')}</p>`;
  }

  /* ---------------------------------------------------------- AUTH */
  function viewAuth() {
    const a = S.auth, demo = S.store && S.store.kind === 'demo';
    const brand = `<div class="brand"><div class="logo">${I.logo}</div><div><h1>FinancePRO</h1><p>${t('appTagline')}</p></div></div>`;
    if (a.mode === 'reset') {
      return `<div class="auth">${brand}<h2>${t('forgot')}</h2><p class="lead">${t('email')}</p>
        <form data-form="reset"><div class="field"><input class="input" type="email" name="email" placeholder="${t('email')}" autocomplete="email" required></div>
        <div class="err">${esc(a.err)}</div>${a.info ? `<div class="notice ai">${esc(a.info)}</div>` : ''}
        <button class="btn" ${a.busy ? 'disabled' : ''}>${t('resetSend')}</button></form>
        <div class="auth-foot"><button class="linkbtn" data-act="authMode" data-v="signin">${t('back')}</button></div></div>`;
    }
    const up = a.mode === 'signup';
    return `<div class="auth">${brand}
      <h2>${up ? t('signUp') : t('welcomeTitle')}</h2><p class="lead">${t('welcomeLead')}</p>
      <button class="btn outline" data-act="google">${I.google}${t('google')}</button>
      <div class="divider">${t('or')}</div>
      <form data-form="${up ? 'signup' : 'signin'}">
        ${up ? `<div class="field"><input class="input" name="name" placeholder="${t('name')}" autocomplete="given-name" required></div>` : ''}
        <div class="field"><input class="input" type="email" name="email" placeholder="${t('email')}" autocomplete="email" required></div>
        <div class="field"><input class="input" type="password" name="password" placeholder="${t('password')}" autocomplete="${up ? 'new-password' : 'current-password'}" required></div>
        <div class="err">${esc(a.err)}</div>${a.info ? `<div class="notice ai">${esc(a.info)}</div>` : ''}
        <button class="btn" ${a.busy ? 'disabled' : ''}>${up ? t('signUp') : t('signIn')}</button>
      </form>
      ${up ? '' : `<div class="auth-foot"><button class="linkbtn" data-act="authMode" data-v="reset">${t('forgot')}</button></div>`}
      <div class="auth-foot">${up ? t('haveAccount') : t('noAccount')} <button class="linkbtn" data-act="authMode" data-v="${up ? 'signin' : 'signup'}">${up ? t('signIn') : t('signUp')}</button></div>
      ${demo ? `<div class="divider">demo</div><button class="btn soft" data-act="demo">✨ ${t('tryDemo')}</button>` : ''}
    </div>`;
  }

  async function afterAuth(user) {
    if (!user) return;
    S.user = user; S.view = 'home'; await loadData();
  }

  /* ---------------------------------------------------------- SHEETS */
  function openSheet(kind, data) { S.sheet = { kind, data: data || {} }; renderSheet(); }
  function closeSheet() { S.sheet = null; S.form = null; $layer.innerHTML = ''; }
  function renderSheet() {
    if (!S.sheet) { $layer.innerHTML = ''; return; }
    const builders = { tx: sheetTx, field: sheetField, quick: sheetQuick, bill: sheetBill, cat: sheetCat, invite: sheetInvite, join: sheetJoin, settle: sheetSettle, confirm: sheetConfirm, newPassword: sheetNewPw };
    const keepScroll = $layer.querySelector('.sheet') ? $layer.querySelector('.sheet').scrollTop : 0;
    $layer.innerHTML = `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${builders[S.sheet.kind](S.sheet.data)}</div>`;
    const sh = $layer.querySelector('.sheet'); if (sh) sh.scrollTop = keepScroll;
    const af = $layer.querySelector('[autofocus]'); if (af) setTimeout(() => af.focus(), 60);
  }
  const head = title => `<div class="sheet-head"><h2>${title}</h2><button class="close" data-act="closeSheet" aria-label="${t('cancel')}">${I.close}</button></div>`;

  // --- transaction sheet
  function newForm(x) {
    if (x) return { id: x.id, type: x.type, amountStr: String(x.amount).replace('.', FP.lang === 'el' ? ',' : '.'), category: x.category, note: x.note || '', date: x.date, vault: x.vault, own: x.user === me(), showNote: !!x.note, showDate: x.date !== FP.todayIso() };
    return { type: 'expense', amountStr: '', category: 'groceries', note: '', date: FP.todayIso(), vault: S.vault === 'shared' && S.profile.partner ? 'shared' : 'personal', own: true, showNote: false, showDate: false };
  }
  const dec = () => (FP.lang === 'el' ? ',' : '.');
  const amountVal = f => { const v = parseFloat((f.amountStr || '0').replace(',', '.')); return isNaN(v) ? 0 : FP.round2(v); };
  function amountHtml(f) {
    const s = f.amountStr || '0';
    return `<div class="amount-display num ${f.type}" id="amt">${f.type === 'income' ? '+' : ''}${esc(s)}<span class="cur">${FP.currency === 'EUR' ? '€' : FP.currency === 'USD' ? '$' : FP.currency === 'GBP' ? '£' : FP.currency}</span></div>`;
  }
  function sheetTx() {
    const f = S.form;
    if (f.type === 'settlement') {
      return head(t('settleTitle')) + `<div class="amount-display num">${money(amountVal(f))}</div><p class="amount-meta">${esc(FP.dayLabel(f.date))}</p>
        ${f.own ? `<button class="btn danger" data-act="deleteTx">${t('delete')}</button>` : ''}`;
    }
    const cats = FP.allCategories(S.profile).filter(c => c.type === f.type);
    const ro = !f.own;
    return head(f.id ? t('editTx') : t('newTx')) + `
      <div class="seg full" role="group" style="margin-bottom:6px">
        <button data-act="ftxType" data-v="expense" aria-pressed="${f.type === 'expense'}">${t('expense')}</button>
        <button data-act="ftxType" data-v="income" aria-pressed="${f.type === 'income'}">${t('incomeOne')}</button>
      </div>
      ${amountHtml(f)}
      <div class="amount-meta">${esc(FP.dayLabel(f.date))}${f.vault === 'shared' ? ' · 👥 ' + t('shared') : ''}${ro ? ' · ' + t('paidBy', { name: esc(S.txs.find(x => x.id === f.id).userName) }) : ''}</div>
      <div class="cat-grid">${cats.map(c => `<button class="cat-opt" data-act="fcat" data-v="${c.id}" aria-pressed="${f.category === c.id}"><span class="cat-ic" style="${tint(c.color)}">${c.emoji}</span>${esc(FP.catName(c))}</button>`).join('')}</div>
      <div class="extras">
        <button data-act="fnote" class="${f.note ? 'set' : ''}">${I.note}${t('note')}</button>
        <button data-act="fdate" class="${f.date !== FP.todayIso() ? 'set' : ''}">${I.calendar}${t('date')}</button>
        ${f.id ? '' : `<button data-act="scan">${I.camera}${t('scan').split(' ')[0]}</button>`}
        ${S.profile.partner && !f.id ? `<button data-act="fvault" data-v="${f.vault === 'shared' ? 'personal' : 'shared'}" class="${f.vault === 'shared' ? 'set' : ''}" aria-pressed="${f.vault === 'shared'}">${I.users}${t('shared')}</button>` : ''}
      </div>
      ${f.showNote ? `<div class="field" style="margin-top:10px"><input class="input" data-inp="fnote" value="${esc(f.note)}" placeholder="${t('notePh')}" maxlength="80"></div>` : ''}
      ${f.showDate ? `<div class="field" style="margin-top:10px"><input class="input" type="date" data-inp="fdate" value="${f.date}" max="${FP.todayIso()}"></div>` : ''}
      ${f.scanMsg ? `<div class="notice ai" style="margin-top:10px">${esc(f.scanMsg)}</div>` : ''}
      <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', dec(), '0', 'del'].map(k => `<button data-act="key" data-k="${k}" aria-label="${k === 'del' ? 'backspace' : k}">${k === 'del' ? I.del : k}</button>`).join('')}</div>
      <div class="btn-row sheet-save">
        ${f.id && f.own ? `<button class="btn danger" data-act="deleteTx" style="flex:0 0 auto;width:auto;padding:15px 18px" aria-label="${t('delete')}">${I.trash}</button>` : ''}
        <button class="btn" data-act="saveTx" id="saveTx" ${amountVal(f) > 0 && !ro ? '' : 'disabled'}>${t('save')}</button>
      </div>
      <input type="file" accept="image/*" capture="environment" id="scanInput" hidden>`;
  }
  function refreshAmount() {
    const el = document.getElementById('amt');
    if (el) el.outerHTML = amountHtml(S.form);
    const b = document.getElementById('saveTx');
    if (b) b.disabled = !(amountVal(S.form) > 0 && S.form.own);
  }
  function pressKey(k) {
    const f = S.form; let s = f.amountStr || '';
    if (k === 'del') s = s.slice(0, -1);
    else if (k === ',' || k === '.') { if (!s.includes(dec())) s = (s || '0') + dec(); }
    else {
      const parts = s.split(dec());
      if (parts[1] !== undefined && parts[1].length >= 2) return;
      if (parts[0].replace(/\D/g, '').length >= 7 && parts[1] === undefined) return;
      s = s === '0' ? k : s + k;
    }
    f.amountStr = s; refreshAmount();
  }

  async function saveTx() {
    const f = S.form, amount = amountVal(f);
    if (!(amount > 0)) return;
    const payload = { type: f.type, amount, category: f.category, note: f.note.trim(), date: f.date, vault: f.vault };
    try {
      if (f.id) {
        const row = await S.store.updateTx(f.id, payload);
        S.txs = S.txs.map(x => (x.id === f.id ? row : x));
        toast(t('saved'));
      } else {
        const row = await S.store.addTx(payload);
        S.txs.unshift(row); sortTxs();
        toast(t('added', { amount: money(amount), cat: esc(FP.catName(catOf(f.category))) }), { label: t('undo'), fn: () => removeTx(row.id, true) });
      }
      closeSheet(); render();
    } catch (e) { fail(e); }
  }
  function sortTxs() { S.txs.sort((a, b) => b.date.localeCompare(a.date)); }
  async function removeTx(id, silent) {
    const x = S.txs.find(y => y.id === id); if (!x) return;
    try {
      await S.store.deleteTx(id);
      S.txs = S.txs.filter(y => y.id !== id); render();
      if (!silent) toast(t('deleted'), { label: t('undo'), fn: async () => { const r = await S.store.restoreTx(x); S.txs.push(r && r.id ? r : x); sortTxs(); render(); } });
    } catch (e) { fail(e); }
  }

  async function handleScan(file) {
    if (!file) return;
    const f = S.form;
    f.scanMsg = t('scanning'); renderSheet();
    try {
      const image = await downscale(file, 1280);
      const r = await S.store.ai({ mode: 'receipt', image });
      if (!r || !(r.amount > 0)) throw new Error('no amount');
      f.type = 'expense';
      f.amountStr = String(FP.round2(r.amount)).replace('.', dec());
      if (r.category && FP.allCategories(S.profile).some(c => c.id === r.category && c.type === 'expense')) f.category = r.category;
      if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date <= FP.todayIso()) { f.date = r.date; f.showDate = r.date !== FP.todayIso(); }
      if (r.note) { f.note = String(r.note).slice(0, 80); f.showNote = true; }
      f.scanMsg = t('scanDone');
    } catch (e) { console.error(e); f.scanMsg = t('scanFail'); }
    renderSheet();
  }
  function downscale(file, max) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = rej; img.src = url;
    });
  }

  // --- simple field
  const FIELD = {
    name: { title: () => t('name'), type: 'text' },
    goal: { title: () => t('monthlyGoal'), type: 'number' },
    startBalance: { title: () => t('startBalance'), type: 'number' }
  };
  function sheetField(d) {
    const cfg = FIELD[d.k];
    return head(cfg.title()) + `<form data-form="field" data-k="${d.k}">
      <div class="field"><input class="input" name="v" type="${cfg.type}" ${cfg.type === 'number' ? 'inputmode="decimal" step="0.01" min="0"' : ''} value="${esc(S.profile[d.k])}" autofocus required></div>
      <button class="btn">${t('save')}</button></form>`;
  }
  function catSelect(type, val, name) {
    return `<select class="input" name="${name || 'category'}">${FP.allCategories(S.profile).filter(c => c.type === type).map(c => `<option value="${c.id}" ${c.id === val ? 'selected' : ''}>${c.emoji} ${esc(FP.catName(c))}</option>`).join('')}</select>`;
  }
  function sheetQuick(d) {
    const q = S.profile.quick.find(x => x.id === d.id) || { label: '', amount: '', category: 'dining' };
    return head(d.id ? t('edit') : t('addQuick')) + `<form data-form="quick" data-id="${d.id || ''}">
      <div class="field"><label>${t('label')}</label><input class="input" name="label" value="${esc(q.label)}" maxlength="24" required autofocus></div>
      <div class="field"><label>${t('amount')}</label><input class="input" name="amount" type="number" inputmode="decimal" step="0.01" min="0.01" value="${q.amount}" required></div>
      <div class="field"><label>${t('category')}</label>${catSelect('expense', q.category)}</div>
      <div class="btn-row">${d.id ? `<button type="button" class="btn danger" data-act="delItem" data-list="quick" data-id="${d.id}">${t('delete')}</button>` : ''}<button class="btn">${t('save')}</button></div></form>`;
  }
  function sheetBill(d) {
    const b = S.profile.bills.find(x => x.id === d.id) || { name: '', amount: '', day: 1, category: 'housing' };
    return head(d.id ? t('edit') : t('addBill')) + `<form data-form="bill" data-id="${d.id || ''}">
      <div class="field"><label>${t('billName')}</label><input class="input" name="name" value="${esc(b.name)}" maxlength="30" required autofocus></div>
      <div class="input-row">
        <div class="field"><label>${t('amount')}</label><input class="input" name="amount" type="number" inputmode="decimal" step="0.01" min="0.01" value="${b.amount}" required></div>
        <div class="field"><label>${t('billDay')}</label><input class="input" name="day" type="number" inputmode="numeric" min="1" max="31" value="${b.day}" required></div>
      </div>
      <div class="field"><label>${t('category')}</label>${catSelect('expense', b.category)}</div>
      <div class="btn-row">${d.id ? `<button type="button" class="btn danger" data-act="delItem" data-list="bills" data-id="${d.id}">${t('delete')}</button>` : ''}<button class="btn">${t('save')}</button></div></form>`;
  }
  function sheetCat(d) {
    const c = (S.profile.customCats || []).find(x => x.id === d.id) || { el: '', emoji: '🏷️', type: 'expense' };
    return head(d.id ? t('edit') : t('addCat')) + `<form data-form="cat" data-id="${d.id || ''}">
      <div class="input-row">
        <div class="field" style="flex:0 0 84px"><label>${t('emoji')}</label><input class="input" name="emoji" value="${esc(c.emoji)}" maxlength="4" required style="text-align:center;font-size:22px"></div>
        <div class="field"><label>${t('catName')}</label><input class="input" name="name" value="${esc(c.el)}" maxlength="24" required autofocus></div>
      </div>
      <div class="field"><label>${t('type')}</label><select class="input" name="type"><option value="expense" ${c.type === 'expense' ? 'selected' : ''}>${t('expense')}</option><option value="income" ${c.type === 'income' ? 'selected' : ''}>${t('incomeOne')}</option></select></div>
      <div class="btn-row">${d.id ? `<button type="button" class="btn danger" data-act="delItem" data-list="customCats" data-id="${d.id}">${t('delete')}</button>` : ''}<button class="btn">${t('save')}</button></div></form>`;
  }
  function sheetInvite(d) {
    return head(t('inviteCode')) + `<p class="muted" style="margin-top:0">${t('inviteShare')}</p>
      <div class="amount-display num" style="font-size:40px;letter-spacing:.08em">${d.code ? esc(d.code) : '<span class="typing"><i></i><i></i><i></i></span>'}</div>
      ${d.code ? `<button class="btn" data-act="copy" data-v="${esc(d.code)}" style="margin-top:12px">${I.copy}${d.copied ? t('copied') : 'Copy'}</button>` : ''}`;
  }
  function sheetJoin() {
    return head(t('joinCode')) + `<form data-form="join"><div class="field"><input class="input" name="code" placeholder="${t('joinPh')}" autocapitalize="characters" autocomplete="off" required autofocus style="text-align:center;font-size:22px;letter-spacing:.08em"></div>
      <button class="btn">${t('join')}</button></form>`;
  }
  function sheetSettle() {
    const bal = FP.A.sharedBalance(sharedTxs(), me(), S.profile.partner.id, S.profile.split / 100);
    const amt = Math.abs(bal.pos);
    const from = bal.pos > 0 ? partnerName() : t('you'), to = bal.pos > 0 ? t('you') : partnerName();
    return head(t('settleTitle')) + `<div class="amount-display num">${money(amt)}</div>
      <p class="muted" style="text-align:center;margin:4px 0 18px">${esc(t('settleConfirm', { amount: money(amt), from, to }))}</p>
      <button class="btn accent" data-act="doSettle">🤝 ${t('settleUp')}</button>`;
  }
  function sheetConfirm(d) {
    return head(d.title) + `<p class="muted" style="margin-top:0">${esc(d.body || '')}</p>
      <div class="btn-row"><button class="btn soft" data-act="closeSheet">${t('cancel')}</button><button class="btn danger" data-act="confirmYes">${esc(d.yes)}</button></div>`;
  }
  function sheetNewPw() {
    return head(t('password')) + `<form data-form="newpw"><div class="field"><input class="input" type="password" name="pw" autocomplete="new-password" minlength="8" required autofocus></div><button class="btn">${t('save')}</button></form>`;
  }

  async function saveProfile(patch) {
    try { await S.store.saveProfile(patch); Object.assign(S.profile, patch); applyLocale(); applyTheme(); render(); }
    catch (e) { fail(e); }
  }

  /* ---------------------------------------------------------- events */
  const ACT = {
    go: el => { S.view = el.dataset.v; closeSheet(); render(); window.scrollTo(0, 0);
      if (el.dataset.anchor) setTimeout(() => { const a = document.getElementById(el.dataset.anchor); if (a) a.scrollIntoView({ block: 'start' }); }, 30); },
    vault: el => { S.vault = el.dataset.v; render(); },
    ftype: el => { S.filters.type = el.dataset.v; render(); },
    more: () => { S.txLimit += 200; render(); },
    month: el => { const n = FP.addMonths(S.insightsYm, Number(el.dataset.d)); if (n <= nowYm()) { S.insightsYm = n; render(); } },
    newTx: el => { S.form = newForm(); openSheet('tx'); if (el.dataset.scan) setTimeout(() => ACT.scan(), 80); },
    editTx: el => { const x = S.txs.find(y => y.id === el.dataset.id); if (!x) return; S.form = newForm(x); openSheet('tx'); },
    closeSheet: () => closeSheet(),
    ftxType: el => { const f = S.form; f.type = el.dataset.v; const first = FP.allCategories(S.profile).find(c => c.type === f.type); if (catOf(f.category).type !== f.type) f.category = first.id; renderSheet(); },
    fcat: el => { S.form.category = el.dataset.v; $layer.querySelectorAll('.cat-opt').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === el.dataset.v)); },
    fnote: () => { S.form.showNote = !S.form.showNote; renderSheet(); const i = $layer.querySelector('[data-inp="fnote"]'); if (i) i.focus(); },
    fdate: () => { S.form.showDate = !S.form.showDate; renderSheet(); },
    fvault: el => { S.form.vault = el.dataset.v; renderSheet(); },
    key: el => pressKey(el.dataset.k),
    saveTx: () => saveTx(),
    deleteTx: () => { const id = S.form.id; closeSheet(); removeTx(id); },
    scan: () => { const i = document.getElementById('scanInput'); if (i) i.click(); },
    quick: async el => {
      const q = S.profile.quick.find(x => x.id === el.dataset.id); if (!q) return;
      try {
        const row = await S.store.addTx({ type: 'expense', amount: q.amount, category: q.category, note: q.label, date: FP.todayIso(), vault: 'personal' });
        S.txs.unshift(row); sortTxs(); render();
        toast(t('added', { amount: money(q.amount), cat: esc(q.label) }), { label: t('undo'), fn: () => removeTx(row.id, true) });
      } catch (e) { fail(e); }
    },
    payBill: async el => {
      const b = S.profile.bills.find(x => x.id === el.dataset.id); if (!b) return;
      const ym = nowYm();
      try {
        const row = await S.store.addTx({ type: 'expense', amount: b.amount, category: b.category, note: b.name, date: FP.todayIso(), vault: 'personal' });
        S.txs.unshift(row); sortTxs();
        const bills = S.profile.bills.map(x => (x.id === b.id ? { ...x, paid: (x.paid || []).concat(ym) } : x));
        await saveProfile({ bills });
        toast(t('added', { amount: money(b.amount), cat: esc(b.name) }));
      } catch (e) { fail(e); }
    },
    addBill: () => openSheet('bill', {}),
    editField: el => openSheet('field', { k: el.dataset.k }),
    editQuick: el => openSheet('quick', { id: el.dataset.id }),
    editBill: el => openSheet('bill', { id: el.dataset.id }),
    editCat: el => openSheet('cat', { id: el.dataset.id }),
    delItem: el => {
      const list = el.dataset.list;
      saveProfile({ [list]: (S.profile[list] || []).filter(x => x.id !== el.dataset.id) }); closeSheet();
    },
    invite: async () => {
      openSheet('invite', {});
      try { const code = await S.store.createInvite(); if (S.sheet && S.sheet.kind === 'invite') { S.sheet.data.code = code; renderSheet(); } }
      catch (e) { closeSheet(); fail(e); }
    },
    join: () => openSheet('join'),
    copy: async el => { try { await navigator.clipboard.writeText(el.dataset.v); } catch (e) {} S.sheet.data.copied = true; renderSheet(); },
    leave: () => openSheet('confirm', { title: t('leaveVault'), body: t('leaveConfirm'), yes: t('leaveVault'), fn: async () => { try { await S.store.leaveVault(); S.vault = 'personal'; await loadData(); } catch (e) { fail(e); } } }),
    settle: () => openSheet('settle'),
    doSettle: async () => {
      const bal = FP.A.sharedBalance(sharedTxs(), me(), S.profile.partner.id, S.profile.split / 100);
      const amt = FP.round2(Math.abs(bal.pos));
      try {
        const row = await S.store.addTx({ type: 'settlement', amount: amt, category: bal.pos < 0 ? 'settle_paid' : 'settle_received', note: '', date: FP.todayIso(), vault: 'shared' });
        S.txs.unshift(row); sortTxs(); closeSheet(); render(); toast(t('settledToast'));
      } catch (e) { fail(e); }
    },
    confirmYes: () => { const fn = S.sheet.data.fn; closeSheet(); fn(); },
    clearChat: () => { S.chat = []; render(); },
    ask: el => ask(el.dataset.q),
    csv: () => {
      const blob = new Blob(['﻿' + FP.toCsv(S.txs, S.profile)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'financepro-' + FP.todayIso() + '.csv';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    demoReset: async () => { await S.store.reset(); await loadData(); toast('✓'); },
    signOut: async () => { await S.store.signOut(); S.user = null; S.profile = null; S.txs = []; S.chat = []; S.view = 'home'; S.auth = { mode: 'signin', err: '', info: '' }; render(); },
    authMode: el => { S.auth = { mode: el.dataset.v, err: '', info: '' }; render(); },
    demo: async () => afterAuth(await S.store.start()),
    google: async () => { try { const u = await S.store.signInGoogle(); if (u) afterAuth(u); } catch (e) { S.auth.err = e.message; render(); } },
    toastAction: () => { const fn = S.toastAction; $toast.innerHTML = ''; S.toastAction = null; if (fn) fn(); }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  document.addEventListener('input', e => {
    const el = e.target, k = el.dataset.inp;
    if (!k) return;
    if (k === 'q') {
      S.filters.q = el.value; const pos = el.selectionStart; render();
      const n = document.querySelector('[data-inp="q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
    } else if (k === 'fnote') S.form.note = el.value;
    else if (k === 'fdate') { if (el.value) { S.form.date = el.value; const m = $layer.querySelector('.amount-meta'); if (m) m.textContent = FP.dayLabel(el.value); } }
    else if (k === 'split') { const lbl = document.getElementById('splitLbl'); if (lbl) lbl.textContent = `${t('you')} ${el.value}% · ${partnerName()} ${100 - el.value}%`; }
  });
  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.id === 'scanInput') return handleScan(el.files && el.files[0]);
    if (el.dataset.inp === 'pref') {
      if (el.dataset.k === 'lang') FP.safeStorage.set('fp_lang', el.value);
      saveProfile({ [el.dataset.k]: el.value });
    }
    if (el.dataset.inp === 'split') {
      try { await S.store.setSplit(Number(el.value)); S.profile.split = Number(el.value); render(); } catch (err) { fail(err); }
    }
  });

  document.addEventListener('submit', async e => {
    const form = e.target, kind = form.dataset.form; if (!kind) return;
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    const num = v => FP.round2(parseFloat(String(v).replace(',', '.')) || 0);
    if (kind === 'chat') { const q = (fd.q || '').trim(); form.reset(); return ask(q); }
    if (kind === 'signin' || kind === 'signup' || kind === 'reset') {
      const a = S.auth; a.err = ''; a.info = '';
      if (!fd.email || (kind !== 'reset' && !fd.password)) { a.err = t('fillAll'); return render(); }
      if (kind === 'signup' && fd.password.length < 8) { a.err = t('pwShort'); return render(); }
      a.busy = true; render();
      try {
        if (kind === 'reset') { await S.store.resetPassword(fd.email); a.info = t('resetSent'); }
        else {
          const u = kind === 'signin' ? await S.store.signIn(fd.email, fd.password) : await S.store.signUp(fd.email, fd.password, fd.name);
          if (u) { a.busy = false; return afterAuth(u); }
          a.info = t('checkEmail');
        }
      } catch (err) { a.err = err.message || t('errGeneric'); }
      a.busy = false; return render();
    }
    if (kind === 'field') {
      const k = form.dataset.k; const v = FIELD[k].type === 'number' ? num(fd.v) : fd.v.trim();
      closeSheet(); return saveProfile({ [k]: v });
    }
    if (kind === 'quick' || kind === 'bill' || kind === 'cat') {
      const list = kind === 'quick' ? 'quick' : kind === 'bill' ? 'bills' : 'customCats';
      const id = form.dataset.id || (kind === 'cat' ? 'c_' : '') + FP.uid().slice(0, 8);
      let item;
      if (kind === 'quick') item = { id, label: fd.label.trim(), amount: num(fd.amount), category: fd.category };
      if (kind === 'bill') {
        const old = S.profile.bills.find(x => x.id === id);
        item = { id, name: fd.name.trim(), amount: num(fd.amount), day: Math.min(31, Math.max(1, parseInt(fd.day, 10) || 1)), category: fd.category, paid: old ? old.paid : [] };
      }
      if (kind === 'cat') {
        const n = (S.profile.customCats || []).length;
        item = { id, type: fd.type, emoji: fd.emoji.trim() || '🏷️', el: fd.name.trim(), en: fd.name.trim(), color: FP.CUSTOM_COLORS[n % FP.CUSTOM_COLORS.length] };
        const old = (S.profile.customCats || []).find(x => x.id === id); if (old) item.color = old.color;
      }
      const arr = (S.profile[list] || []).slice();
      const i = arr.findIndex(x => x.id === id);
      if (i >= 0) arr[i] = item; else arr.push(item);
      closeSheet(); return saveProfile({ [list]: arr });
    }
    if (kind === 'join') {
      try { await S.store.joinInvite(fd.code); closeSheet(); S.vault = 'shared'; await loadData(); }
      catch (err) { fail(err); }
    }
    if (kind === 'newpw') {
      try { await S.store.updatePassword(fd.pw); closeSheet(); toast(t('saved')); } catch (err) { fail(err); }
    }
  });

  // physical keyboard support for the amount pad
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && S.sheet) return closeSheet();
    if (!S.sheet || S.sheet.kind !== 'tx' || !S.form) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === ',' || e.key === '.') pressKey(dec());
    else if (e.key === 'Backspace') pressKey('del');
    else if (e.key === 'Enter') saveTx();
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.FP_NO_SW) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  boot();
})();
