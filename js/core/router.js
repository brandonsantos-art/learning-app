/* NetSec Academy – tiny hash router (works from file:// and as a PWA) */
(function (global) {
  const NSA = global.NSA;
  const reactive = (global.Vue && global.Vue.reactive) ? global.Vue.reactive : (x => x);

  const routes = [
    { name: 'dashboard', pattern: '/dashboard', title: 'Dashboard' },
    { name: 'paths', pattern: '/paths', title: 'Learning Paths' },
    { name: 'networking', pattern: '/networking', title: 'Networking' },
    { name: 'security', pattern: '/security', title: 'Cybersecurity' },
    { name: 'lesson', pattern: '/lesson/:id', title: 'Lesson' },
    { name: 'labs', pattern: '/labs', title: 'Virtual Labs' },
    { name: 'lab-netsim', pattern: '/labs/netsim/:id', title: 'Network Simulator' },
    { name: 'lab-terminal', pattern: '/labs/terminal/:id', title: 'Terminal Lab' },
    { name: 'lab-security', pattern: '/labs/security/:id', title: 'Cybersecurity Lab' },
    { name: 'lab-troubleshoot', pattern: '/labs/troubleshoot/:id', title: 'Troubleshooting Lab' },
    { name: 'missions', pattern: '/missions', title: 'Real-World Missions' },
    { name: 'mission', pattern: '/missions/:id', title: 'Mission' },
    { name: 'challenges', pattern: '/challenges', title: 'Challenges' },
    { name: 'assessments', pattern: '/assessments', title: 'Assessments' },
    { name: 'exam', pattern: '/assessments/exam/:level', title: 'Level Examination' },
    { name: 'achievements', pattern: '/achievements', title: 'Achievements' },
    { name: 'resources', pattern: '/resources', title: 'Study Tools' },
    { name: 'profile', pattern: '/profile', title: 'Profile & Settings' }
  ];

  function parseHash(hash) {
    let h = (hash || '').replace(/^#/, '');
    if (!h || h === '/') h = '/dashboard';
    const [pathPart, queryPart] = h.split('?');
    const query = {};
    if (queryPart) queryPart.split('&').forEach(kv => { const [k, v] = kv.split('='); if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    const segs = pathPart.split('/').filter(Boolean);
    for (const r of routes) {
      const psegs = r.pattern.split('/').filter(Boolean);
      if (psegs.length !== segs.length) continue;
      const params = {}; let ok = true;
      for (let i = 0; i < psegs.length; i++) {
        if (psegs[i][0] === ':') params[psegs[i].slice(1)] = decodeURIComponent(segs[i]);
        else if (psegs[i] !== segs[i]) { ok = false; break; }
      }
      if (ok) return { name: r.name, params, query, path: '/' + segs.join('/'), title: r.title };
    }
    return { name: 'notfound', params: {}, query, path: pathPart, title: 'Not found' };
  }

  const route = reactive(parseHash(global.location ? global.location.hash : ''));

  function sync() {
    const r = parseHash(global.location.hash);
    Object.assign(route, r);
    if (global.scrollTo) try { global.scrollTo({ top: 0 }); } catch (e) {}
  }
  function navigate(path, query) {
    let h = path;
    if (query) { const qs = Object.keys(query).filter(k => query[k] != null && query[k] !== '').map(k => encodeURIComponent(k) + '=' + encodeURIComponent(query[k])).join('&'); if (qs) h += '?' + qs; }
    if (global.location) {
      if (('#' + h) === global.location.hash) sync(); else global.location.hash = h;
    }
  }
  function back() { if (global.history && global.history.length > 1) global.history.back(); else navigate('/dashboard'); }
  if (global.addEventListener) global.addEventListener('hashchange', sync);

  NSA.router = { routes, route, navigate, back, parseHash, sync };
})(typeof globalThis !== 'undefined' ? globalThis : window);
