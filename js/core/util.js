/* NetSec Academy – shared utilities (framework independent) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad(n, w) { let s = String(n); while (s.length < (w || 2)) s = '0' + s; return s; }

  // Deterministic PRNG (mulberry32) for daily/weekly challenges
  function seededRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function randInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(arr, rng) {
    const r = rng || Math.random; const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Dates
  function todayKey(d) {
    const x = d ? new Date(d) : new Date();
    return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  }
  function addDays(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return todayKey(dt);
  }
  function isoWeekKey(d) {
    const x = d ? new Date(d) : new Date();
    const date = new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return date.getUTCFullYear() + '-W' + pad(week);
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function timeAgo(iso) {
    if (!iso) return '';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    return Math.floor(s / 86400) + ' d ago';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Minimal Markdown → HTML for lesson content (trusted, authored content only)
  function inline(s) {
    let out = escapeHtml(s);
    // code spans first (protect contents)
    const codes = [];
    out = out.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
      if (/^#/.test(u)) return '<a href="' + u + '">' + t + '</a>';
      return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>';
    });
    out = out.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code>' + codes[Number(i)] + '</code>');
    return out;
  }
  function md(text) {
    if (!text) return '';
    const lines = String(text).replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let i = 0;
    let para = [];
    function flushPara() {
      if (para.length) { html.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    }
    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();
      if (t === '') { flushPara(); i++; continue; }
      // fenced code
      if (/^```/.test(t)) {
        flushPara();
        const lang = t.slice(3).trim();
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
        i++;
        html.push('<pre' + (lang ? ' data-lang="' + escapeHtml(lang) + '"' : '') + '><code>' + escapeHtml(buf.join('\n')) + '</code></pre>');
        continue;
      }
      // callouts :::tip Title / :::warn / :::danger / :::real / :::note
      let m = t.match(/^:::(tip|warn|danger|real|note)\s*(.*)$/);
      if (m) {
        flushPara();
        const kind = m[1]; const title = m[2] || { tip: 'Tip', warn: 'Common mistake', danger: 'Security warning', real: 'In the real world', note: 'Note' }[kind];
        const buf = []; i++;
        while (i < lines.length && !/^:::\s*$/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
        i++;
        html.push('<div class="callout ' + kind + '"><div class="callout-title">' + escapeHtml(title) + '</div>' + md(buf.join('\n')) + '</div>');
        continue;
      }
      // headings
      m = t.match(/^(#{1,4})\s+(.*)$/);
      if (m) { flushPara(); const lvl = Math.min(4, m[1].length + 2); html.push('<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>'); i++; continue; }
      if (/^---+$/.test(t)) { flushPara(); html.push('<hr>'); i++; continue; }
      // blockquote
      if (/^>\s?/.test(t)) {
        flushPara(); const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) { buf.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        html.push('<blockquote>' + md(buf.join('\n')) + '</blockquote>');
        continue;
      }
      // table
      if (/^\|.*\|$/.test(t) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
        flushPara();
        const header = t.slice(1, -1).split('|').map(c => c.trim());
        i += 2;
        const rows = [];
        while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { rows.push(lines[i].trim().slice(1, -1).split('|').map(c => c.trim())); i++; }
        let tbl = '<div class="scroll-x"><table><thead><tr>' + header.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
        for (const r of rows) tbl += '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
        tbl += '</tbody></table></div>';
        html.push(tbl);
        continue;
      }
      // lists
      if (/^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) {
        flushPara();
        const ordered = /^\d+\.\s+/.test(t);
        const items = [];
        while (i < lines.length) {
          const lt = lines[i].trim();
          if (ordered ? /^\d+\.\s+/.test(lt) : /^[-*]\s+/.test(lt)) {
            items.push(lt.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ''));
            i++;
          } else if (lt !== '' && /^\s{2,}/.test(lines[i]) && items.length) {
            items[items.length - 1] += ' ' + lt; i++;
          } else break;
        }
        html.push((ordered ? '<ol>' : '<ul>') + items.map(x => '<li>' + inline(x) + '</li>').join('') + (ordered ? '</ol>' : '</ul>'));
        continue;
      }
      // raw html passthrough for lines starting with <
      if (/^<(div|svg|table|section|figure)/.test(t)) {
        flushPara(); const buf = [line]; i++;
        while (i < lines.length && lines[i].trim() !== '') { buf.push(lines[i]); i++; }
        html.push(buf.join('\n'));
        continue;
      }
      para.push(t); i++;
    }
    flushPara();
    return html.join('\n');
  }

  function debounce(fn, ms) {
    let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c, a), ms); };
  }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(arr, f) { return arr.reduce((a, x) => a + (f ? f(x) : x), 0); }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function plural(n, s, p) { return n + ' ' + (n === 1 ? s : (p || s + 's')); }
  function normalizeCmd(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function download(filename, text, type) {
    try {
      const blob = new Blob([text], { type: type || 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
      return true;
    } catch (e) { return false; }
  }

  NSA.util = { uid, clamp, pad, seededRng, hashString, randInt, pick, shuffle, todayKey, addDays, isoWeekKey, fmtDate, fmtDateTime, timeAgo, escapeHtml, md, inline, debounce, deepClone, sum, pct, plural, normalizeCmd, download };
})(typeof globalThis !== 'undefined' ? globalThis : window);
