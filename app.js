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
