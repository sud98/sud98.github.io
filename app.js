// Registra il service worker: l'app si installa sul telefono e si apre anche senza rete
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw_2.js").catch(err => console.warn("Service worker non registrato:", err));
    });
}
