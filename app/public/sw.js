// HALO Service Worker — self-destruct old caches, then go minimal
// This version clears ALL old caches to fix stale content issues

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Pass everything through to network — no caching
self.addEventListener("fetch", () => {
  // Let the browser handle all fetches normally
  return;
});
