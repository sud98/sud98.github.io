// Prima prova la rete (così le modifiche al sito si vedono subito),
// se non c'è connessione usa la copia salvata.
// I dati di Supabase non passano da qui: arrivano sempre dal database.
const CACHE = "gewoodart-v2";

const FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./logo.png",
    "./icon-192.png"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const req = event.request;
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(cache => cache.put(req, copy));
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }))
    );
});
