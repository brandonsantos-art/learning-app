/* NetSec Academy – service worker: cache everything for offline use */
const CACHE = 'netsec-academy-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './vendor/vue.global.prod.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './js/core/util.js', './js/core/store.js', './js/core/router.js', './js/core/ui.js',
  './js/engines/subnet.js', './js/engines/netsim.js', './js/engines/ios.js',
  './js/engines/terminal-fs.js', './js/engines/terminal-net.js', './js/engines/terminal-win.js', './js/engines/terminal.js',
  './js/engines/quiz.js', './js/engines/srs.js',
  './js/data/glossary.js', './js/data/flashcards.js',
  './js/data/lessons-l1-networking-a.js', './js/data/lessons-l1-networking-b.js', './js/data/lessons-l1-security.js',
  './js/data/lessons-l2.js', './js/data/lessons-l2-security.js', './js/data/lessons-l3.js', './js/data/lessons-l3-security.js',
  './js/data/labs-netsim.js', './js/data/labs-terminal.js', './js/data/labs-security.js', './js/data/labs-troubleshoot.js',
  './js/data/missions.js', './js/data/achievements.js', './js/data/resources.js',
  './js/core/gamification.js', './js/core/progress.js',
  './js/views/components.js', './js/views/demos.js', './js/views/quiz-view.js', './js/views/dashboard.js',
  './js/views/paths.js', './js/views/lesson.js', './js/views/netsim-view.js', './js/views/terminal-view.js',
  './js/views/labs.js', './js/views/missions-view.js', './js/views/challenges.js', './js/views/assessments.js',
  './js/views/achievements-view.js', './js/views/resources-view.js', './js/views/profile.js', './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200 && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
