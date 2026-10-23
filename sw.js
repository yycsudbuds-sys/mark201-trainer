// Service worker: network-first with cache fallback, so the trainer keeps working offline
// and always picks up the newest deploy when online. VERSION is rewritten by tools/build.py.
const VERSION = 'b4444c2248';
const CACHE = 'mark201-' + VERSION;
const CORE = ['./', './index.html', './app/styles.css', './app/game.css', './app/visuals.js', './app/map.js', './app/views/lesson.js', './app/main.js', './app/data.js', './app/engine.js', './app/store.js', './app/ui.js', './app/achievements.js',
  './app/views/home.js', './app/views/campaign.js', './app/views/drill.js', './app/views/exam.js', './app/views/arcade.js', './app/views/learn.js', './app/views/progress.js', './app/views/settings.js', './app/views/runner.js', './app/views/concept.js', './app/views/common.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => null)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok && (sameOrigin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: sameOrigin });
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match('./index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
