/* CARGAR CENTRAL · bookmarklet
   Se ejecuta DENTRO de jumbo.cl (favorito de Safari). Lee el pedido de la
   semana desde Central y carga el remanente Jumbo al carro con la sesión del
   propio teléfono. Objetivo: Ritual → Jumbo → un toque → carro lleno. */
(async () => {
  const B = "https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com";
  const P = document.createElement("div");
  P.style.cssText = "position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483647;background:#1C2026;color:#fff;font:15px/1.4 system-ui;padding:14px 16px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.35);max-height:60vh;overflow:auto";
  const say = (t, ok) => { P.innerHTML = t; P.style.background = ok === false ? "#8b1e1e" : (ok === true ? "#1f6b45" : "#1C2026"); };
  document.body.appendChild(P);
  say("Central de la Casa · leyendo el pedido…");
  try {
    /* 1 · Central (credenciales heredadas de Control por el hash del bookmarklet) */
    if (!location.hostname.endsWith("jumbo.cl")) throw new Error("Ábrelo estando en jumbo.cl");
    if (!window.supabase) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"; s.onload = res; s.onerror = () => rej(new Error("no cargó supabase-js")); document.head.appendChild(s); });
    const CRED = { url: "https://uhueleobqziherfxzggf.supabase.co", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodWVsZW9icXppaGVyZnh6Z2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTQ5MTcsImV4cCI6MjEwMTQzMDkxN30.trKXg80---oHSZZfDX2-t3jNYFaT_AXM3mIiSgWAFjE", email: "benjaira@gmail.com", pass: "Waynawa201" };
    const sb = supabase.createClient(CRED.url, CRED.key, { auth: { persistSession: false } });
    const r = await sb.auth.signInWithPassword({ email: CRED.email, password: CRED.pass });
    if (r.error) throw new Error("Central: " + r.error.message);
    const m = await sb.from("miembros").select("hogar_id").single(); if (m.error) throw new Error("sin hogar");
    const hogar = m.data.hogar_id;
    const get = async k => { const q = await sb.from("kv").select("v").eq("hogar_id", hogar).eq("k", "cc:" + k).maybeSingle(); return q.data ? q.data.v : null; };
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const lp = new Date(); lp.setDate(lp.getDate() + 1); lp.setDate(lp.getDate() - ((lp.getDay() + 6) % 7));
    const SEM = iso(lp);
    const lista = await get("shoplist:" + SEM);
    if (!lista || !lista.carro) throw new Error("No hay pedido aprobado para la semana del " + SEM + ". Primero el Ritual en Control.");
    const skus = (await get("skus:jumbo")) || {};
    const jumbo = (lista.jumboCarro && lista.jumboCarro.length) ? lista.jumboCarro : lista.carro;
    const nz = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    const porNombre = {}; for (const k in skus) if (skus[k] && skus[k].n) porNombre[nz(skus[k].n)] = skus[k];
    const items = jumbo.map(x => { const s = (x.id && skus[x.id]) || porNombre[nz(x.n)] || {}; return { id: x.id || nz(x.n), n: x.n, un: x.un || 1, sku: s.s || null, slug: s.g || "" }; });
    const con = items.filter(x => x.sku), sin = items.filter(x => !x.sku);
    if (!con.length) throw new Error("Ninguno de los " + items.length + " productos tiene código Jumbo guardado.");
    /* 2 · headers de sesión: interceptar el próximo PATCH del sitio (click a "Agregar") */
    say("Semana del " + SEM + " · " + con.length + " productos. Capturando la sesión de Jumbo…");
    let H = null;
    const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (mm, u) { this.__u = String(u); this.__m = mm; this.__h = {}; return XO.apply(this, arguments); };
    XMLHttpRequest.prototype.setRequestHeader = function (k, v) { try { if (this.__u && this.__u.includes("cencosud")) this.__h[k] = v; } catch (_) { } return XH.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function (b) { try { if (this.__u && /cart\/items/.test(this.__u) && this.__m === "PATCH") { H = this.__h; this.abort(); return; } } catch (_) { } return XS.apply(this, arguments); };
    /* también vía fetch nativo (por si el sitio migró) */
    const F0 = window.fetch;
    window.fetch = function (u, o) { try { if (String(u).includes("cencosud") && o && o.method === "PATCH" && /cart\/items/.test(String(u))) { H = Object.assign({}, o.headers || {}); return Promise.resolve(new Response("{}", { status: 200 })); } } catch (_) { } return F0.apply(this, arguments); };
    const bs = [...document.querySelectorAll("button")].filter(b => /^\s*Agregar\s*$/i.test(b.textContent));
    if (!bs.length) throw new Error("Abre una búsqueda de Jumbo (cualquier producto) y toca el favorito de nuevo.");
    bs[0].click();
    for (let i = 0; i < 25 && !H; i++) await new Promise(x => setTimeout(x, 200));
    window.fetch = F0; XMLHttpRequest.prototype.open = XO; XMLHttpRequest.prototype.send = XS; XMLHttpRequest.prototype.setRequestHeader = XH;
    if (!H) throw new Error("No pude capturar la sesión. ¿Iniciaste sesión en Jumbo en este teléfono?");
    const HDR = {}; for (const k in H) HDR[k] = H[k]; HDR["Content-Type"] = "application/json";
    /* 3 · cargar */
    const res = [];
    for (const it of con) {
      const body = { items: [{ skuId: String(it.sku), quantity: it.un, name: it.n, slug: it.slug, brand: "", isUnitary: false, giftable: false, itemQuantityLimit: 99, isUnitaryEligible: false, measurementUnitUn: "un", unitMultiplierUn: 1, soldBy: "Jumbo" }], store: "jumboclj512" };
      try { const rr = await F0(B + "/cart/items", { method: "PATCH", headers: HDR, credentials: "include", body: JSON.stringify(body) }); res.push({ it, ok: rr.ok, st: rr.status }); }
      catch (e) { res.push({ it, ok: false, st: 0 }); }
      say("Cargando… " + res.length + "/" + con.length + " · " + it.n);
      await new Promise(x => setTimeout(x, 320));
    }
    const ok = res.filter(x => x.ok), mal = res.filter(x => !x.ok);
    let html = "<b>Listo · " + ok.length + " en el carro</b>";
    if (mal.length) html += "<br>No entraron: " + mal.map(x => x.it.n).join(", ");
    if (sin.length) html += "<br>Sin código (agrega a mano): " + sin.map(x => x.n).join(", ");
    html += '<br><br><a href="https://www.jumbo.cl/checkout/#/cart" style="color:#F0A834;font-weight:800">Ir a pagar →</a> &nbsp; <span style="opacity:.6" onclick="this.parentNode.parentNode.remove()">cerrar</span>';
    say(html, mal.length === 0);
  } catch (e) { say("✗ " + (e && e.message || e) + '<br><br><span style="opacity:.6" onclick="this.parentNode.remove()">cerrar</span>', false); }
})();
