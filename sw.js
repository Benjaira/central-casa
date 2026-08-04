/* Service worker · Central de la Casa · v2
   Regla 1: el HTML va SIEMPRE a la red primero — así cada apertura trae la
   última versión publicada. El caché es sólo respaldo sin internet.
   Regla 2: cada app es su propio respaldo. El sw NUNCA responde /control/
   con /cocina/ ni al revés: antes de esta versión, un fallback cruzado hacía
   exactamente eso y Control no cargaba. */
const V = "cc-v2";
const BASE = ["./icon-192.png","./icon-512.png","./apple-touch-icon.png",
              "./icon-control-192.png","./icon-control-512.png","./apple-touch-icon-control.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V)
    .then(c => Promise.allSettled(BASE.map(u => c.add(u))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin.includes("supabase.co")) return;   // los datos nunca se cachean

  const esPagina = req.mode === "navigate" || req.destination === "document";
  if (esPagina) {
    e.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(V).then(c => c.put(req, copia));
        return r;
      }).catch(() =>
        caches.match(req).then(r => r || new Response(
          "<meta charset='utf-8'><body style='font-family:system-ui;background:#FAF7F0;color:#1C2026;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center'><div><b>Sin conexión</b><br>Esta pantalla necesita internet la primera vez.<br>Revisa la red y vuelve a abrir.</div></body>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        )))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copia = res.clone();
        caches.open(V).then(c => c.put(req, copia));
      }
      return res;
    })));
  }
});
