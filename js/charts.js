/* Tiny SVG chart helpers (no library). Colors come from CSS variables. */
window.FP = window.FP || {};
FP.Charts = {
  /** cumulative spend this month (solid) vs last month (dashed) */
  pace(cur, prev, daysInMonth, opts) {
    const W = 340, H = 150, P = { l: 4, r: 4, t: 12, b: 22 };
    const max = Math.max(1, ...cur, ...prev) * 1.08;
    const x = i => P.l + (i / Math.max(1, daysInMonth - 1)) * (W - P.l - P.r);
    const y = v => P.t + (1 - v / max) * (H - P.t - P.b);
    const path = arr => arr.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const area = arr => arr.length ? path(arr) + ` L${x(arr.length - 1).toFixed(1)} ${H - P.b} L${x(0)} ${H - P.b} Z` : '';
    const last = cur.length - 1;
    const ticks = [1, 8, 15, 22, daysInMonth].map(d =>
      `<text x="${x(d - 1)}" y="${H - 4}" font-size="10" fill="var(--ink-3)" text-anchor="${d === 1 ? 'start' : d === daysInMonth ? 'end' : 'middle'}">${d}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${FP.esc(opts && opts.label || '')}">
      <defs><linearGradient id="gPace" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      <line x1="${P.l}" x2="${W - P.r}" y1="${H - P.b}" y2="${H - P.b}" stroke="var(--line)"/>
      <path d="${path(prev)}" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>
      <path d="${area(cur)}" fill="url(#gPace)"/>
      <path d="${path(cur)}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      ${last >= 0 ? `<circle cx="${x(last)}" cy="${y(cur[last])}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2.5"/>` : ''}
      ${ticks}
    </svg>`;
  },

  ring(pct, size, color) {
    const r = (size - 8) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="7"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color || 'var(--accent)'}" stroke-width="7" stroke-linecap="round"
        stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  },

  donut(segs, size, centerTop, centerBottom) {
    const total = segs.reduce((a, s) => a + s.v, 0) || 1;
    const r = size / 2 - 12, cx = size / 2, C = 2 * Math.PI * r;
    let off = 0;
    const gap = segs.length > 1 ? 2 : 0;
    const arcs = segs.map(s => {
      const len = Math.max(0, (s.v / total) * C - gap);
      const el = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${s.color}" stroke-width="16"
        stroke-dasharray="${len.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"/>`;
      off += (s.v / total) * C;
      return el;
    }).join('');
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="16"/>${arcs}
      <text x="${cx}" y="${cx - 2}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--ink)">${FP.esc(centerTop)}</text>
      <text x="${cx}" y="${cx + 15}" text-anchor="middle" font-size="11" fill="var(--ink-2)">${FP.esc(centerBottom)}</text>
    </svg>`;
  },

  /** grouped bars: income vs expense per month */
  bars(months, activeYm) {
    const W = 340, H = 170, P = { t: 14, b: 24 };
    const max = Math.max(1, ...months.map(m => Math.max(m.income, m.expense))) * 1.1;
    const slot = W / months.length, bw = Math.min(14, slot / 3.2);
    const y = v => P.t + (1 - v / max) * (H - P.t - P.b);
    const rect = (x, v, fill, op) => {
      const top = y(v), h = Math.max(0, H - P.b - top);
      return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4" fill="${fill}" opacity="${op}"/>`;
    };
    const g = months.map((m, i) => {
      const cx = slot * i + slot / 2;
      const op = m.ym === activeYm ? 1 : 0.55;
      return rect(cx - bw - 2, m.income, 'var(--pos)', op) + rect(cx + 2, m.expense, 'var(--neg)', op) +
        `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="11" fill="${m.ym === activeYm ? 'var(--ink)' : 'var(--ink-3)'}" font-weight="${m.ym === activeYm ? 700 : 500}">${FP.monthName(FP.monthIdx(m.ym), 'short')}</text>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img"><line x1="0" x2="${W}" y1="${H - P.b}" y2="${H - P.b}" stroke="var(--line)"/>${g}</svg>`;
  }
};

/* Inline icons (stroke, 24px grid) */
FP.ICON = (() => {
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    home: s('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>'),
    list: s('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
    chart: s('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    spark: s('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    plus: s('<path d="M12 5v14M5 12h14"/>'),
    close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    back: s('<path d="M15 18l-6-6 6-6"/>'),
    next: s('<path d="M9 18l6-6-6-6"/>'),
    chev: s('<path d="M9 18l6-6-6-6"/>'),
    camera: s('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    calendar: s('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    note: s('<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>'),
    users: s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>'),
    send: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    search: s('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    del: s('<path d="M9.5 7 4 12l5.5 5H20V7z"/><path d="M12 10l4 4M16 10l-4 4"/>'),
    gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    logo: s('<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>'),
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>',
    copy: s('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
    trash: s('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>')
  };
})();
