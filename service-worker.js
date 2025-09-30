const VERSION = 'v1.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './img/icon-192.png',
  './img/icon-512.png',
  './files/files.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('shell-' + VERSION);
    await cache.addAll(APP_SHELL);
    // Pre-cache the listed files (best-effort)
    try {
      const res = await fetch('./files/files.json', {cache:'no-store'});
      const list = await res.json();
      const docCache = await caches.open('docs-' + VERSION);
      await docCache.addAll(list.map(x => './' + x.path));
    } catch (e) {
      // ignore if offline first time
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k)));
    clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Network-first for the files list so updates are seen quickly
  if (url.pathname.endsWith('/files/files.json')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request);
        const cache = await caches.open('shell-' + VERSION);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open('shell-' + VERSION);
        const cached = await cache.match(event.request);
        return cached || Response.error();
      }
    })());
    return;
  }
  // Cache-first for everything else
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const resp = await fetch(event.request);
      const cache = await caches.open('runtime-' + VERSION);
      cache.put(event.request, resp.clone());
      return resp;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
