const CACHE_NAME = "snaproom-app-shell-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/reset.css",
  "./css/variables.css",
  "./css/typography.css",
  "./css/global.css",
  "./css/components.css",
  "./css/responsive.css",
  "./css/home.css",
  "./css/booth.css",
  "./css/frames.css",
  "./css/editor.css",
  "./css/gallery.css",
  "./css/settings.css",
  "./js/app.js",
  "./js/router.js",
  "./js/components/footer.js",
  "./js/components/frame-card.js",
  "./js/components/header.js",
  "./js/core/backup-engine.js",
  "./js/core/camera-engine.js",
  "./js/core/collage-engine.js",
  "./js/core/compression-engine.js",
  "./js/core/export-engine.js",
  "./js/core/filter-engine.js",
  "./js/core/frame-engine.js",
  "./js/data/filters.js",
  "./js/data/frames.js",
  "./js/data/seasonal-frame-art.js",
  "./js/pages/booth.js",
  "./js/pages/editor.js",
  "./js/pages/frames.js",
  "./js/pages/gallery.js",
  "./js/pages/home.js",
  "./js/pages/settings.js",
  "./js/services/database.js",
  "./js/services/pwa-service.js",
  "./js/services/settings-service.js",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.svg",
  "./assets/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("snaproom-app-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("blob:") || event.request.url.startsWith("indexeddb:")) return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () =>
        (await caches.match("./index.html")) || Response.error()
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
    )
  );
});
