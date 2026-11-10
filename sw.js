/* Lawanku — service worker: cache-first biar jalan offline. */
const CACHE = "lawanku-v33";
const SHELL = [
  "./", "index.html", "i18n.js", "app.js", "styles.css",
  "manifest.webmanifest", "logo.svg", "data-1.json", "data-2.json", "items.json", "tiers.json",
  "fonts/outfit-700.woff2", "fonts/outfit-800.woff2",
  "fonts/inter-400.woff2", "fonts/inter-600.woff2", "fonts/inter-700.woff2",
];
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match("index.html"));
    })
  );
});
