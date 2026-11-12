/* NetSec Academy – UI services: toasts, modals, icons */
(function (global) {
  const NSA = global.NSA;
  const reactive = (global.Vue && global.Vue.reactive) ? global.Vue.reactive : (x => x);

  const toasts = reactive([]);
  function toast(msg, kind, ms) {
    const id = NSA.util.uid('t');
    toasts.push({ id, msg, kind: kind || 'info' });
    setTimeout(() => { const i = toasts.findIndex(t => t.id === id); if (i >= 0) toasts.splice(i, 1); }, ms || 3200);
  }

  // Modal service: one modal at a time. body may be markdown string, html, or a component name with props.
  const modal = reactive({ open: false, title: '', html: '', component: null, props: null, actions: [], wide: false, dismissible: true });
  let resolver = null;
  function openModal(opts) {
    closeModal(null);
    modal.open = true;
    modal.title = opts.title || '';
    modal.html = opts.html || (opts.md ? NSA.util.md(opts.md) : '');
    modal.component = opts.component || null;
    modal.props = opts.props || null;
    modal.actions = opts.actions || [{ label: 'Close', kind: '', value: null }];
    modal.wide = !!opts.wide;
    modal.dismissible = opts.dismissible !== false;
    return new Promise(res => { resolver = res; });
  }
  function closeModal(value) {
    if (!modal.open) return;
    modal.open = false; modal.component = null; modal.props = null;
    const r = resolver; resolver = null;
    if (r) r(value);
  }
  function confirm(message, opts) {
    opts = opts || {};
    return openModal({ title: opts.title || 'Please confirm', md: message, actions: [
      { label: opts.cancelLabel || 'Cancel', kind: '', value: false },
      { label: opts.okLabel || 'Confirm', kind: opts.danger ? 'danger' : 'primary', value: true }
    ] });
  }
  function alert(message, title) {
    return openModal({ title: title || 'Notice', md: message, actions: [{ label: 'OK', kind: 'primary', value: true }] });
  }

  // Inline SVG icon paths (24x24, stroke based)
  const icons = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    paths: '<path d="M4 6h8a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h12"/><circle cx="4" cy="6" r="1.5"/><circle cx="20" cy="22" r="1.5"/>',
    network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v5M12 12.5 6.5 17M12 12.5l5.5 4.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="m9 12 2 2 4-4"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3"/><path d="M7 15h10"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 12v4M9 20h6M10 16h4v4h-4z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    flame: '<path d="M12 3s5 4 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-6 1-8.5z"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    warning: '<path d="M12 3 2 21h20L12 3z"/><path d="M12 10v4M12 18h.01"/>',
    cable: '<path d="M4 20 20 4M7 4h4v4H7zM13 16h4v4h-4z"/>',
    pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    server: '<rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M8 6.5h.01M8 17.5h.01"/>',
    switch: '<rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/>',
    router: '<circle cx="12" cy="12" r="9"/><path d="M8 10l-2 2 2 2M16 10l2 2-2 2M10 8l2-2 2 2M10 16l2 2 2-2"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z"/>',
    firewall: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v5M15 9v5M9 14v6"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/>',
    note: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 13h8M8 17h5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h14v14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4.9a7 7 0 0 0-1.7-1L14.4 3h-4.8l-.4 2.5a7 7 0 0 0-1.7 1L5.1 6 3.1 9.4l2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 1.7 1l.4 2.5h4.8l.4-2.5a7 7 0 0 0 1.7-1l2.4.9 2-3.4-2-1.6c.1-.3.1-.7.1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
    key: '<circle cx="8" cy="14" r="4"/><path d="m11 11 9-9M16 6l2 2M19 3l2 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    bug: '<path d="M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0z"/><path d="M4 13h4M16 13h4M5 7l3 2M19 7l-3 2M5 19l3-2M19 19l-3-2M10 5l1-2M14 5l-1-2"/>',
    graph: '<path d="M4 20h16M6 16l4-5 4 3 5-7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.3 1 2.5h6c0-1.2.3-1.9 1-2.5A6 6 0 0 0 12 3z"/>',
    pin: '<path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2"/>'
  };
  function iconSvg(name, size) {
    const p = icons[name] || icons.info;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  NSA.ui = { toasts, toast, modal, openModal, closeModal, confirm, alert, icons, iconSvg };
})(typeof globalThis !== 'undefined' ? globalThis : window);
