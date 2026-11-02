// Service worker: network-first with cache fallback, so the trainer keeps working offline
// and always picks up the newest deploy when online. VERSION is rewritten by tools/build.py.
const VERSION = 'c7a620556b';
const CACHE = 'mark201-' + VERSION;
const CORE = ['./', './index.html', './app/css/tokens.css', './app/css/base.css', './app/css/components.css', './app/css/scenes.css', './app/css/modes.css', './app/audio.js', './app/scenes.js', './app/icons.js', './app/cutscene.js', './app/battle.js', './app/commanders.js', './app/scene-director.js', './app/geo.js', './app/geo/med.json', './app/maplabels.js', './app/cosmetic.js', './app/wartable.js', './app/vignettes.js', './app/legion.js', './app/shop.js', './app/visuals.js', './app/map.js', './app/views/lesson.js', './app/main.js', './app/config.js', './app/sync.js', './app/account.js', './app/courses/index.js', './app/courses/mark201/pack.js', './app/courses/mark201/data.js', './app/engine.js', './app/store.js', './app/ui.js', './app/achievements.js',
  './app/css/dash.css', './app/css/contrast.css', './app/courses/fin201/pack.js', './app/courses/fin201/data.js', './app/courses/fin201/scenes.js', './app/courses/fin201/generators.js', './app/views/login.js', './app/views/dash.js', './app/views/home.js', './app/views/campaign.js', './app/views/drill.js', './app/views/exam.js', './app/views/arcade.js', './app/views/learn.js', './app/views/progress.js', './app/views/settings.js', './app/views/runner.js', './app/views/concept.js', './app/views/common.js',
  './app/math.js', './app/vendor/katex/katex.min.css', './app/vendor/katex/katex.min.js', './app/vendor/katex/fonts/KaTeX_AMS-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2', './app/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2', './app/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Main-Bold.woff2', './app/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2', './app/vendor/katex/fonts/KaTeX_Main-Italic.woff2', './app/vendor/katex/fonts/KaTeX_Main-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2', './app/vendor/katex/fonts/KaTeX_Math-Italic.woff2', './app/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2', './app/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2', './app/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Script-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Size1-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Size2-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Size3-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Size4-Regular.woff2', './app/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2'];

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
      if (res && res.ok && (sameOrigin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('jsdelivr.net'))) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: sameOrigin });
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match('./index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
