// Prima prova la rete (così le modifiche al sito si vedono subito),
// se non c'è connessione usa la copia salvata.
// I dati di Supabase non passano da qui: arrivano sempre dal database.
const CACHE = "gewoodart-v5";

// Foto di Supabase: salvate sul telefono e riusate, per non consumare il traffico del piano free.
// Ha un nome fisso così non si svuota quando esce una versione nuova dell'app.
const FOTO_CACHE = "gewoodart-foto";
const FOTO_URL = "https://ixarnqyrsonhshkctcki.supabase.co/storage/v1/object/public/";
// Ogni quanto chiedere a Supabase se una foto salvata è cambiata (risposta "304" = 0 byte)
const CONTROLLO_FOTO_MS = 7 * 24 * 60 * 60 * 1000;

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
    event.waitUntil(caches.open(CACHE).then(cache =>
        cache.addAll(FILES.map(f => new Request(f, { cache: "reload" })))
    ));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FOTO_CACHE).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const req = event.request;
    if (req.method !== "GET") return;

    if (req.url.startsWith(FOTO_URL)) {
        event.respondWith(foto(event));
        return;
    }

    if (new URL(req.url).origin !== self.location.origin) return;

    // "no-cache": chiede sempre a GitHub se il file è cambiato, invece di
    // riusare per 10 minuti la copia del browser (così gli aggiornamenti si vedono subito)
    event.respondWith(
        fetch(new Request(req.url, { cache: "no-cache" }))
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(cache => cache.put(req, copy));
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }))
    );
});

// Prima la copia sul telefono; se non c'è la scarico una volta e la salvo
async function foto(event) {
    const req = event.request;
    const url = req.url.split("?")[0];
    const cache = await caches.open(FOTO_CACHE);
    const salvata = await cache.match(url);

    if (salvata) {
        const quando = Number(salvata.headers.get("x-salvata-il") || 0);
        if (Date.now() - quando > CONTROLLO_FOTO_MS) {
            event.waitUntil(ricontrollaFoto(cache, url, salvata.clone()).catch(() => {}));
        }
        return salvata;
    }

    try {
        const res = await fetch(url, { mode: "cors", credentials: "omit" });
        if (res.ok) event.waitUntil(salvaFoto(cache, url, res.clone()));
        return res;
    } catch (e) {
        return fetch(req);
    }
}

async function salvaFoto(cache, url, res) {
    const headers = new Headers(res.headers);
    headers.set("x-salvata-il", String(Date.now()));
    const copia = new Response(await res.blob(), { status: 200, statusText: "OK", headers });
    await cache.put(url, copia);
}

// Chiede a Supabase solo "è cambiata?": se no (304) non scarica niente
async function ricontrollaFoto(cache, url, salvata) {
    const ultimaModifica = salvata.headers.get("last-modified");
    const res = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: ultimaModifica ? { "If-Modified-Since": ultimaModifica } : {}
    });
    if (res.status === 304) await salvaFoto(cache, url, salvata);
    else if (res.ok) await salvaFoto(cache, url, res);
}
