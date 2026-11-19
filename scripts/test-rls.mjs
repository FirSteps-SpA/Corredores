// Controles de seguridad contra Supabase LOCAL (`supabase start`), vía la API real.
// Spec 0: registro público cerrado y contraseñas robustas.
// Spec 1: catálogo (tablas `propiedades`, `propiedad_fotos`, `admins`) y bucket `propiedades`,
// probados como público (anon), usuario autenticado no admin y admin.
//
// Uso:
//   npm run test:rls                 contra el stack local (lee claves de `supabase status`)
//   npm run test:rls -- --remoto     contra producción, solo lo que no necesita clave secreta
//                                    (registro cerrado); usa NEXT_PUBLIC_SUPABASE_URL y
//                                    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
//
// En modo local aborta si la URL no es 127.0.0.1/localhost. Cada ejecución usa emails y slugs
// nuevos y borra lo que crea, así que puede repetirse sin `supabase db reset`.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const remoto = process.argv.includes("--remoto");

function entorno() {
  if (remoto) {
    return {
      API_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    };
  }
  const out = execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8" });
  return JSON.parse(out.slice(out.indexOf("{")));
}

const { API_URL: API, PUBLISHABLE_KEY: PUB, SECRET_KEY: SECRET } = entorno();
if (!API || !PUB) {
  console.error("Abortado: faltan la URL o la clave publishable.");
  process.exit(2);
}
const esLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API);
if (remoto === esLocal) {
  console.error(`Abortado: ${remoto ? "--remoto con una URL local" : "la URL no es local"} (${API}).`);
  process.exit(2);
}

// Distancia en metros entre dos puntos { lat, lng } (haversine).
function distancia(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// `raw` envía el cuerpo tal cual (archivos de Storage) con su `contentType`.
async function http(method, path, { key = PUB, token, body, raw, contentType, prefer, headers = {} } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      apikey: key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": raw === undefined ? "application/json" : contentType,
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  return { status: res.status, data };
}

let fallas = 0;
function check(nombre, ok, detalle = "") {
  if (!ok) fallas++;
  console.log(`${ok ? "OK   " : "FALLA"} ${nombre}${detalle ? `  [${detalle}]` : ""}`);
}

const run = randomUUID().slice(0, 8);
console.log(`Supabase ${remoto ? "REMOTO" : "local"}: ${API}\n`);

// --- Registro público cerrado (spec closed-registration) ---
// Primero la configuración: si el registro estuviera abierto, el POST crearía una cuenta real.
let r = await http("GET", "/auth/v1/settings");
const cerrado = r.data?.disable_signup === true;
check("la configuración de Auth tiene el registro desactivado", cerrado, `disable_signup=${r.data?.disable_signup}`);

if (cerrado) {
  const email = `registro-${run}@example.com`;
  r = await http("POST", "/auth/v1/signup", { body: { email, password: "Registro-12345" } });
  check("el registro con la clave publishable se rechaza", r.status >= 400, `HTTP ${r.status} ${r.data?.error_code ?? ""}`);

  if (!remoto) {
    const u = await http("GET", "/auth/v1/admin/users?per_page=1000", { key: SECRET });
    const existe = (u.data?.users ?? []).some((x) => x.email === email);
    check("el registro rechazado no crea el usuario", u.status === 200 && !existe, `HTTP ${u.status}`);
  }
}

// --- Contraseñas robustas (solo local: necesita crear una cuenta de prueba) ---
if (!remoto) {
  const email = `clave-${run}@test.local`;
  const password = "Valida-12345";
  const creado = await http("POST", "/auth/v1/admin/users", {
    key: SECRET,
    body: { email, password, email_confirm: true },
  });
  check("el equipo crea una cuenta confirmada con la API de administración", creado.status === 200, `HTTP ${creado.status}`);

  const login = await http("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  check("la cuenta creada inicia sesión sin confirmar el correo", !!login.data?.access_token, `HTTP ${login.status}`);

  const token = login.data?.access_token;
  for (const [nombre, clave] of [
    ["una contraseña de 8 caracteres se rechaza", "Corta123"],
    ["una contraseña sin dígitos se rechaza", "SoloLetrasLargas"],
    ["una contraseña sin letras se rechaza", "1234567890123"],
  ]) {
    r = await http("PUT", "/auth/v1/user", { token, body: { password: clave } });
    check(nombre, r.data?.error_code === "weak_password", `HTTP ${r.status} ${r.data?.error_code ?? ""}`);
  }

  if (creado.data?.id) await http("DELETE", `/auth/v1/admin/users/${creado.data.id}`, { key: SECRET });
}

// --- Catálogo de propiedades y fotos (specs catalog-access, property-catalog, photo-storage) ---
// Solo local: prepara datos con la clave secreta (no pasa por RLS) y prueba como anon, no admin y admin.
async function catalogo() {
  const SVC = { key: SECRET };
  const REP = "return=representation";

  async function cuenta(alias, esAdmin) {
    const email = `${alias}-${run}@test.local`;
    const password = "Valida-12345";
    const u = await http("POST", "/auth/v1/admin/users", { ...SVC, body: { email, password, email_confirm: true } });
    if (u.status !== 200) throw new Error(`crear ${alias}: HTTP ${u.status}`);
    if (esAdmin) {
      const a = await http("POST", "/rest/v1/admins", { ...SVC, body: { user_id: u.data.id } });
      if (a.status !== 201) throw new Error(`registrar admin: HTTP ${a.status} ${JSON.stringify(a.data)}`);
    }
    const login = await http("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
    return { id: u.data.id, token: login.data.access_token };
  }

  const propiedad = (sufijo, extra = {}) => ({
    slug: `${sufijo}-${run}`,
    titulo: `Prueba ${sufijo}`,
    operacion: "venta",
    tipo: "casa",
    precio: 1000,
    moneda: "UF",
    comuna: "Iquique",
    ...extra,
  });

  // Preparación
  const admin = await cuenta("admin", true);
  const otro = await cuenta("noadmin", false);
  const quien = { anon: undefined, "no admin": otro.token };
  let r, pub, bor;

  try {
    // Propiedad publicada y borrador con una foto cada una (la del borrador, en BD solamente)
    r = await http("POST", "/rest/v1/propiedades", {
      ...SVC,
      prefer: REP,
      body: [propiedad("publicada", { estado: "publicada" }), propiedad("borrador", { estado: "borrador" })],
    });
    if (r.status !== 201) throw new Error(`crear propiedades: HTTP ${r.status} ${JSON.stringify(r.data)}`);
    [pub, bor] = r.data;
    r = await http("POST", "/rest/v1/propiedad_fotos", {
      ...SVC,
      prefer: REP,
      body: [
        { propiedad_id: pub.id, path: `${pub.id}/a.webp`, orden: 0 },
        { propiedad_id: bor.id, path: `${bor.id}/a.webp`, orden: 0 },
      ],
    });
    if (r.status !== 201) throw new Error(`crear fotos: HTTP ${r.status} ${JSON.stringify(r.data)}`);

    const ids = `id=in.(${pub.id},${bor.id})`;

    // Identidad del admin
    console.log("\n-- Identidad del admin");
    r = await http("GET", "/rest/v1/admins?select=user_id");
    check("anon no ve la lista de admins", r.status >= 400 || (Array.isArray(r.data) && r.data.length === 0), `HTTP ${r.status}`);
    r = await http("POST", "/rest/v1/admins", { token: otro.token, body: { user_id: otro.id } });
    check("un usuario no admin no puede registrarse como admin", r.status >= 400, `HTTP ${r.status}`);
    r = await http("POST", "/rest/v1/rpc/es_admin", { token: otro.token, body: {} });
    check("es_admin() es false para el usuario no admin", r.data === false, `HTTP ${r.status} ${r.data}`);
    r = await http("POST", "/rest/v1/rpc/es_admin", { token: admin.token, body: {} });
    check("es_admin() es true para el admin", r.data === true, `HTTP ${r.status} ${r.data}`);
    r = await http("GET", "/rest/v1/admins?select=user_id", { token: admin.token });
    check("el admin ve solo su fila de admins", r.data?.length === 1 && r.data[0].user_id === admin.id, `filas=${r.data?.length}`);

    // Visibilidad
    console.log("\n-- Visibilidad");
    for (const [nombre, token] of Object.entries(quien)) {
      r = await http("GET", `/rest/v1/propiedades?select=id&${ids}`, { token });
      check(`${nombre} ve la publicada y no el borrador`, r.data?.length === 1 && r.data[0].id === pub.id, `filas=${r.data?.length}`);
      r = await http("GET", `/rest/v1/propiedad_fotos?select=id&propiedad_id=eq.${bor.id}`, { token });
      check(`${nombre} no ve las fotos del borrador`, Array.isArray(r.data) && r.data.length === 0, `filas=${r.data?.length}`);
      r = await http("GET", `/rest/v1/propiedad_fotos?select=id&propiedad_id=eq.${pub.id}`, { token });
      check(`${nombre} ve las fotos de la publicada`, r.data?.length === 1, `filas=${r.data?.length}`);
    }
    for (const estado of ["reservada", "vendida", "arrendada"]) {
      await http("PATCH", `/rest/v1/propiedades?id=eq.${bor.id}`, { ...SVC, body: { estado } });
      r = await http("GET", `/rest/v1/propiedades?select=id&id=eq.${bor.id}`);
      check(`anon ve una propiedad ${estado}`, r.data?.length === 1, `filas=${r.data?.length}`);
    }
    await http("PATCH", `/rest/v1/propiedades?id=eq.${bor.id}`, { ...SVC, body: { estado: "borrador" } });
    r = await http("GET", `/rest/v1/propiedades?select=id&${ids}`, { token: admin.token });
    check("el admin ve la publicada y el borrador", r.data?.length === 2, `filas=${r.data?.length}`);
    r = await http("GET", `/rest/v1/propiedad_fotos?select=id&propiedad_id=eq.${bor.id}`, { token: admin.token });
    check("el admin ve las fotos del borrador", r.data?.length === 1, `filas=${r.data?.length}`);

    // Escritura de quien no es admin
    console.log("\n-- Escritura sin ser admin");
    for (const [nombre, token] of Object.entries(quien)) {
      r = await http("POST", "/rest/v1/propiedades", { token, body: propiedad(`intruso-${nombre.replace(" ", "")}`) });
      check(`${nombre} no puede crear una propiedad`, r.status >= 400, `HTTP ${r.status}`);
      await http("PATCH", `/rest/v1/propiedades?id=eq.${pub.id}`, { token, body: { precio: 1 } });
      await http("DELETE", `/rest/v1/propiedades?id=eq.${pub.id}`, { token });
      r = await http("GET", `/rest/v1/propiedades?select=precio&id=eq.${pub.id}`, SVC);
      check(`${nombre} no puede editar ni borrar una propiedad`, r.data?.[0]?.precio === 1000, `precio=${r.data?.[0]?.precio}`);
      r = await http("POST", "/rest/v1/propiedad_fotos", { token, body: { propiedad_id: pub.id, path: `${pub.id}/x.webp`, orden: 9 } });
      check(`${nombre} no puede registrar una foto`, r.status >= 400, `HTTP ${r.status}`);
      await http("DELETE", `/rest/v1/propiedad_fotos?propiedad_id=eq.${pub.id}`, { token });
      r = await http("GET", `/rest/v1/propiedad_fotos?select=id&propiedad_id=eq.${pub.id}`, SVC);
      check(`${nombre} no puede borrar una foto`, r.data?.length === 1, `filas=${r.data?.length}`);
    }

    // Datos y estados (property-catalog), como admin
    console.log("\n-- Datos de una propiedad");
    const A = { token: admin.token, prefer: REP };
    r = await http("POST", "/rest/v1/propiedades", { ...A, body: propiedad("minima") });
    const min = r.data?.[0];
    check(
      "el admin crea una propiedad mínima con los valores por defecto",
      r.status === 201 && min.estado === "borrador" && min.destacada === false &&
        min.mostrar_direccion === false && Array.isArray(min.caracteristicas) && min.caracteristicas.length === 0,
      `HTTP ${r.status}`,
    );
    const sinComuna = propiedad("sin-comuna");
    delete sinComuna.comuna;
    for (const [nombre, body, esperado] of [
      ["sin comuna se rechaza", sinComuna, 400],
      ["de tipo desconocido se rechaza", propiedad("castillo", { tipo: "castillo" }), 400],
      ["con slug inválido se rechaza", { ...propiedad("x"), slug: `Casa Cavancha ${run}` }, 400],
      ["con slug repetido se rechaza", { ...propiedad("x"), slug: pub.slug }, 409],
      ["con precio negativo se rechaza", propiedad("negativa", { precio: -1 }), 400],
    ]) {
      r = await http("POST", "/rest/v1/propiedades", { ...A, body });
      check(`una propiedad ${nombre}`, r.status === esperado, `HTTP ${r.status} ${r.data?.code ?? ""}`);
    }
    r = await http("POST", "/rest/v1/propiedad_fotos", { ...A, body: { propiedad_id: crypto.randomUUID(), path: "x/y.webp" } });
    check("una foto de una propiedad inexistente se rechaza", r.status === 409, `HTTP ${r.status} ${r.data?.code ?? ""}`);

    await new Promise((ok) => setTimeout(ok, 20));
    r = await http("PATCH", `/rest/v1/propiedades?id=eq.${min.id}`, { ...A, body: { precio: 2000, estado: "publicada", destacada: true } });
    check("el admin edita, publica y destaca", r.data?.[0]?.precio === 2000 && r.data[0].estado === "publicada", `HTTP ${r.status}`);
    check("la edición actualiza updated_at", r.data?.[0] && new Date(r.data[0].updated_at) > new Date(min.updated_at));
    r = await http("PATCH", `/rest/v1/propiedades?id=eq.${min.id}`, { ...A, body: { estado: "vendida" } });
    check("el admin marca la propiedad como vendida", r.data?.[0]?.estado === "vendida", `HTTP ${r.status}`);
    r = await http("POST", "/rest/v1/propiedad_fotos", { ...A, body: [0, 1].map((orden) => ({ propiedad_id: min.id, path: `${min.id}/${orden}.webp`, orden })) });
    check("el admin registra fotos", r.status === 201 && r.data.length === 2, `HTTP ${r.status}`);
    r = await http("DELETE", `/rest/v1/propiedad_fotos?id=eq.${r.data?.[0]?.id}`, A);
    check("el admin borra una foto", r.data?.length === 1, `HTTP ${r.status}`);
    r = await http("DELETE", `/rest/v1/propiedades?id=eq.${min.id}`, A);
    check("el admin borra la propiedad", r.data?.length === 1, `HTTP ${r.status}`);
    r = await http("GET", `/rest/v1/propiedad_fotos?select=id&propiedad_id=eq.${min.id}`, SVC);
    check("al borrar la propiedad se borran los registros de sus fotos", Array.isArray(r.data) && r.data.length === 0, `filas=${r.data?.length}`);

    // Storage (photo-storage)
    console.log("\n-- Fotos en Storage");
    // PNG de 1×1 px
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    const ruta = `${pub.id}/${crypto.randomUUID()}.png`;
    const subir = (token, path, raw, contentType = "image/png") =>
      http("POST", `/storage/v1/object/propiedades/${path}`, { token, raw, contentType });
    const borrar = (token, path) => http("DELETE", "/storage/v1/object/propiedades", { token, body: { prefixes: [path] } });
    const publica = async (path) => (await fetch(`${API}/storage/v1/object/public/propiedades/${path}`)).status;

    r = await subir(admin.token, ruta, png);
    check("el admin sube una foto", r.status === 200, `HTTP ${r.status}`);
    check("la foto se descarga por su URL pública sin sesión", (await publica(ruta)) === 200);
    // Storage responde 400 con statusCode 403 cuando lo rechaza RLS.
    const motivo = (r) => `HTTP ${r.status} ${r.data?.statusCode ?? ""} ${r.data?.message ?? ""}`.trim();
    r = await subir(undefined, `${pub.id}/anon.png`, png);
    check("anon no puede subir", r.data?.statusCode === "403", motivo(r));
    r = await subir(otro.token, `${pub.id}/noadmin.png`, png);
    check("un usuario no admin no puede subir", r.data?.statusCode === "403", motivo(r));
    r = await http("POST", "/storage/v1/object/list/propiedades", { token: admin.token, body: { prefix: pub.id } });
    check("el admin lista la foto subida", r.data?.length === 1, `HTTP ${r.status} archivos=${r.data?.length}`);
    r = await http("POST", "/storage/v1/object/list/propiedades", { body: { prefix: pub.id } });
    check("anon no puede listar el bucket", r.status >= 400 || (Array.isArray(r.data) && r.data.length === 0), `HTTP ${r.status}`);
    r = await http("POST", "/storage/v1/object/list/propiedades", { token: otro.token, body: { prefix: pub.id } });
    check("un usuario no admin no puede listar el bucket", r.status >= 400 || (Array.isArray(r.data) && r.data.length === 0), `HTTP ${r.status}`);
    r = await borrar(otro.token, ruta);
    check("Storage no informa archivos borrados al usuario no admin", Array.isArray(r.data) && r.data.length === 0, `HTTP ${r.status}`);
    check("un usuario no admin no puede borrar la foto", (await publica(ruta)) === 200);
    r = await subir(admin.token, `${pub.id}/doc.pdf`, Buffer.from("%PDF-1.4\n"), "application/pdf");
    check("el admin no puede subir un PDF", r.status >= 400, motivo(r));
    r = await subir(admin.token, `${pub.id}/grande.png`, Buffer.alloc(10 * 1024 * 1024 + 1));
    check("el admin no puede subir una imagen de más de 10 MB", r.status >= 400, motivo(r));
    r = await borrar(admin.token, ruta);
    check("el admin borra la foto", r.status === 200 && r.data?.length === 1, `HTTP ${r.status}`);
    check("la foto borrada deja de estar disponible", (await publica(ruta)) >= 400);

    // Ubicación privada (spec 8): la dirección y las coordenadas exactas ocultas no salen por la API
    console.log("\n-- Ubicación privada");
    const exacta = { lat: -20.2425, lng: -70.1412 };
    r = await http("POST", "/rest/v1/propiedades", {
      ...SVC,
      prefer: REP,
      body: [
        propiedad("oculta", { estado: "publicada", direccion: "Calle Secreta 123", mostrar_direccion: false, ...exacta }),
        propiedad("visible", { estado: "publicada", direccion: "Avenida Visible 456", mostrar_direccion: true, ...exacta }),
      ],
    });
    const [oculta, visible] = r.data ?? [];
    r = await http("GET", `/rest/v1/propiedades?select=direccion,lat,lng&id=eq.${oculta.id}`);
    check("anon no puede leer dirección ni coordenadas de la tabla", r.status >= 400, `HTTP ${r.status} ${r.data?.code ?? ""}`);
    r = await http("GET", `/rest/v1/propiedades?select=id,slug,estado&id=eq.${oculta.id}`);
    check("anon sigue leyendo las demás columnas", r.data?.length === 1, `HTTP ${r.status}`);
    r = await http("GET", `/rest/v1/propiedades_publicas?select=id&${ids}`);
    check("la vista pública no entrega borradores", r.data?.length === 1 && r.data[0].id === pub.id, `filas=${r.data?.length}`);
    r = await http("GET", `/rest/v1/propiedades_publicas?select=direccion,lat,lng&id=eq.${oculta.id}`);
    const aprox = r.data?.[0];
    const metros = aprox?.lat != null ? distancia(exacta, aprox) : NaN;
    check("con dirección oculta, la vista no entrega la dirección", aprox?.direccion === null, `HTTP ${r.status}`);
    check("con dirección oculta, la ubicación es aproximada (distinta y a menos de 500 m)", metros > 0 && metros < 500, `${Math.round(metros)} m`);
    r = await http("GET", `/rest/v1/propiedades_publicas?select=direccion,lat,lng&id=eq.${oculta.id}`);
    check("la ubicación aproximada es la misma en cada lectura", r.data?.[0]?.lat === aprox?.lat && r.data?.[0]?.lng === aprox?.lng);
    r = await http("GET", `/rest/v1/propiedades_publicas?select=direccion,lat,lng&id=eq.${visible.id}`);
    check("con dirección visible, la vista entrega dirección y coordenadas exactas", r.data?.[0]?.direccion === "Avenida Visible 456" && r.data[0].lat === exacta.lat && r.data[0].lng === exacta.lng);
    r = await http("GET", `/rest/v1/propiedades?select=direccion,lat,lng&id=eq.${oculta.id}`, { token: admin.token });
    check("el admin lee la dirección y las coordenadas exactas", r.data?.[0]?.direccion === "Calle Secreta 123" && r.data[0].lat === exacta.lat, `HTTP ${r.status}`);
    r = await http("GET", "/rest/v1/ajustes", { headers: { "Accept-Profile": "privado" } });
    check("el esquema privado (sal) no está expuesto", r.status >= 400, `HTTP ${r.status}`);
  } finally {
    // Limpieza: propiedades (con sus fotos) y usuarios (con su fila de admins)
    await http("DELETE", `/rest/v1/propiedades?slug=like.*-${run}`, SVC);
    for (const u of [admin, otro]) await http("DELETE", `/auth/v1/admin/users/${u.id}`, SVC);
  }
}

if (!remoto) await catalogo();

console.log(`\n${fallas === 0 ? "Todos los controles OK" : `${fallas} control(es) fallaron`}`);
process.exit(fallas === 0 ? 0 : 1);
