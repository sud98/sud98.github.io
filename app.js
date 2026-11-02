// Registra il service worker: l'app si installa sul telefono e si apre anche senza rete
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw_2.js", { updateViaCache: "none" })
            .catch(err => console.warn("Service worker non registrato:", err));
    });

    // Quando arriva una versione nuova dell'app ricarico la pagina una volta
    const avevaController = !!navigator.serviceWorker.controller;
    let ricaricata = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!avevaController || ricaricata) return;
        ricaricata = true;
        window.location.reload();
    });
}

// Dopo aver caricato o sostituito una foto: scarico subito la versione nuova
// e la metto al posto di quella salvata sul telefono
async function aggiornaFotoSalvata(url) {
    if (!url || !("caches" in window)) return;
    const pulito = url.split("?")[0];
    try {
        const res = await fetch(pulito + "?v=" + Date.now(), { mode: "cors", credentials: "omit", cache: "no-store" });
        if (!res.ok) return;
        const headers = new Headers(res.headers);
        headers.set("x-salvata-il", String(Date.now()));
        const cache = await caches.open("gewoodart-foto");
        await cache.put(pulito, new Response(await res.blob(), { status: 200, statusText: "OK", headers }));
    } catch (e) {
        console.warn("Foto non aggiornata sul telefono:", e);
    }
}

// Dopo aver eliminato una foto: la tolgo anche dal telefono
async function dimenticaFotoSalvata(url) {
    if (!url || !("caches" in window)) return;
    try {
        const cache = await caches.open("gewoodart-foto");
        await cache.delete(url.split("?")[0]);
    } catch (e) {}
}
