/* Service worker · Central de la Casa
   Regla: el HTML va SIEMPRE a la red primero. Es lo que resuelve el "no sé si
   estoy en la última versión": cada vez que se abre el ícono, se trae la
   versión publicada. El caché es sólo la red de emergencia si no hay internet.
   Los íconos y las tipografías, al revés: caché primero, no cambian nunca. */
const V = "cc-v1";
const BASE = ["/icon-192.png","/icon-512.png","/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
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
      }).catch(() => caches.match(req).then(r => r || caches.match("/cocina/")))
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
