// Controles del panel /admin contra la app corriendo (`npm run build && npm start`) y Supabase LOCAL.
// Spec 2 (auth-panel): redirecciones del proxy, acceso por rol en el servidor, noindex y
// formularios (login, cierre de sesión, cambio de contraseña).
// Spec 3 (crud-propiedades): listado, filtro y búsqueda, alta, edición, validación, slug,
// acciones rápidas y eliminación (con sus archivos en Storage).
//
// Uso: npm run test:panel   (APP_URL, por defecto http://localhost:3000)
//
// Inicia sesión con @supabase/ssr en Node sobre un almacén de cookies en memoria, para obtener
// las cookies con el mismo formato que lee la app. Los formularios se envían como lo haría un
// navegador sin JavaScript: POST multipart con los campos ocultos que React pone en el HTML
// (id de la server action del build actual) más los campos del formulario. Se verifica lo que
// responde la acción (redirección, cookies y el estado que devuelve, que viaja en el payload
// RSC); cómo se dibuja ese estado en pantalla se revisa en el navegador.
// Aborta si Supabase o la app no son locales. Crea dos cuentas y las borra al terminar.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";

const out = execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8" });
const { API_URL: API, PUBLISHABLE_KEY: PUB, SECRET_KEY: SECRET } = JSON.parse(out.slice(out.indexOf("{")));
const APP = process.env.APP_URL ?? "http://localhost:3000";
const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;
if (!local.test(API) || !local.test(APP)) {
  console.error(`Abortado: Supabase (${API}) y la app (${APP}) deben ser locales.`);
  process.exit(2);
}

let fallas = 0;
function check(nombre, ok, detalle = "") {
  if (!ok) fallas++;
  console.log(`${ok ? "OK   " : "FALLA"} ${nombre}${detalle ? `  [${detalle}]` : ""}`);
}

async function admin(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { apikey: SECRET, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

const run = randomUUID().slice(0, 8);
const password = "Valida-12345";

async function cuenta(alias, esAdmin) {
  const email = `${alias}-${run}@test.local`;
  const u = await admin("POST", "/auth/v1/admin/users", { email, password, email_confirm: true });
  if (u.status !== 200) throw new Error(`crear ${alias}: HTTP ${u.status}`);
  if (esAdmin) {
    const a = await admin("POST", "/rest/v1/admins", { user_id: u.data.id });
    if (a.status !== 201) throw new Error(`registrar admin: HTTP ${a.status}`);
  }
  // Sesión con @supabase/ssr: las cookies quedan en `jar` tal como las escribiría la app.
  const jar = new Map();
  const supabase = createServerClient(API, PUB, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${alias}: ${error.message}`);
  const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
  return { id: u.data.id, email, cookie };
}

async function pedir(path, cookie) {
  const res = await fetch(APP + path, { redirect: "manual", headers: cookie ? { cookie } : {} });
  return { status: res.status, location: res.headers.get("location") ?? "", html: await res.text() };
}
// Cookies de la app (las que escribe el servidor con Set-Cookie).
function aplicarCookies(cookie, res) {
  const jar = new Map(cookie ? cookie.split("; ").map((c) => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)]) : []);
  for (const sc of res.headers.getSetCookie()) {
    const [par] = sc.split(";");
    const nombre = par.slice(0, par.indexOf("="));
    const valor = par.slice(par.indexOf("=") + 1);
    if (!valor || /max-age=0/i.test(sc)) jar.delete(nombre);
    else jar.set(nombre, valor);
  }
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

// Envía el formulario de `path` que tiene un campo cuyo nombre empieza con `campoClave` (y que
// contiene `filtro`, si se indica), con `datos`. `cookieEnvio` permite enviarlo con otra sesión.
async function enviar(path, cookie, campoClave, datos, { cookieEnvio = cookie, filtro = "" } = {}) {
  const pagina = await pedir(path, cookie);
  const form = [...pagina.html.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/g)]
    .map((m) => m[1])
    .find((f) => f.includes(`name="${campoClave}`) && f.includes(filtro));
  if (!form) throw new Error(`sin formulario con ${campoClave} en ${path} (HTTP ${pagina.status})`);
  const fd = new FormData();
  for (const [, attrs] of form.matchAll(/<input([^>]*type="hidden"[^>]*)>/g)) {
    const nombre = attrs.match(/name="([^"]*)"/)?.[1];
    const valor = (attrs.match(/value="([^"]*)"/)?.[1] ?? "").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
    if (nombre) fd.append(nombre, valor);
  }
  for (const [k, v] of Object.entries(datos)) fd.append(k, v);
  const res = await fetch(APP + path, {
    method: "POST",
    redirect: "manual",
    headers: cookieEnvio ? { cookie: cookieEnvio } : {},
    body: fd,
  });
  return {
    status: res.status,
    location: res.headers.get("location") ?? "",
    cookie: aplicarCookies(cookieEnvio, res),
    html: await res.text(),
  };
}

const destino = (r) => (r.location ? new URL(r.location, APP).pathname + new URL(r.location, APP).search : "");

async function propiedades(adm, otro) {
  const tituloBase = `Casa en Cavancha ${run}`;
  const slugBase = `casa-en-cavancha-${run}`;
  const datos = (extra = {}) => ({
    titulo: tituloBase,
    slug: "",
    estado: "borrador",
    codigo: "",
    operacion: "venta",
    tipo: "casa",
    precio: "4.500",
    moneda: "UF",
    gastos_comunes: "",
    comuna: "Iquique",
    sector: "Cavancha",
    region: "Tarapacá",
    direccion: "",
    dormitorios: "3",
    banos: "2",
    estacionamientos: "",
    bodegas: "",
    m2_utiles: "",
    m2_totales: "",
    caracteristicas_otras: "",
    descripcion: "",
    ...extra,
  });
  const filas = async (filtro = `titulo=like.*${run}*`) =>
    (await admin("GET", `/rest/v1/propiedades?select=*&${filtro}&order=created_at`)).data ?? [];

  const total = (await admin("GET", "/rest/v1/propiedades?select=id")).data?.length;
  if (total === 0) {
    const r = await pedir("/admin", adm.cookie);
    check("con el catálogo vacío el listado lo avisa", r.html.includes("Todavía no hay propiedades."));
  }

  // Alta
  let r = await enviar("/admin/propiedades/nueva", adm.cookie, "titulo", datos());
  let [p1] = await filas();
  check("el admin crea una propiedad y va a su página para agregar fotos", r.status === 303 && destino(r) === `/admin/propiedades/${p1?.id}?creada=1` && p1?.precio === 4500, `${r.status} ${destino(r)}`);
  r = await pedir(destino(r), adm.cookie);
  check("la página de la propiedad nueva avisa y muestra la sección de fotos", r.html.includes("Propiedad creada. Agrega sus fotos.") && r.html.includes("Todavía no hay fotos"));
  check("el slug se genera del título", p1?.slug === slugBase, p1?.slug);
  r = await enviar("/admin/propiedades/nueva", adm.cookie, "titulo", datos({ estado: "publicada", codigo: `C-${run}` }));
  const [, p2] = await filas();
  check("un slug repetido recibe el sufijo -2", p2?.slug === `${slugBase}-2`, p2?.slug);

  // Validación
  r = await enviar("/admin/propiedades/nueva", adm.cookie, "titulo", datos({ precio: "", dormitorios: "-2", sector: `Sector ${run}` }));
  check("guardar sin precio y con dormitorios negativos se rechaza", r.status === 200 && (await filas()).length === 2, `${r.status}`);
  check("los errores vuelven por campo", r.html.includes('"precio":"Obligatorio."') && r.html.includes('"dormitorios":"No puede ser negativo."'));
  check("lo ingresado vuelve para no perderlo", r.html.includes(`Sector ${run}`));
  r = await enviar("/admin/propiedades/nueva", adm.cookie, "titulo", datos({ titulo: `Otra ${run}`, codigo: `C-${run}` }));
  check("un código repetido se rechaza en su campo", r.html.includes("Ese código ya lo usa otra propiedad."), `${r.status}`);

  // Edición
  r = await pedir(`/admin/propiedades/${p1.id}`, adm.cookie);
  check("el formulario de edición muestra los valores actuales", r.html.includes(`value="${slugBase}"`) && r.html.includes('value="4500"'));
  r = await enviar(`/admin/propiedades/${p1.id}`, adm.cookie, "titulo", datos({ id: p1.id, slug: p1.slug, precio: "5.200" }));
  [p1] = await filas();
  check("el admin edita el precio y vuelve al listado", r.status === 303 && destino(r) === `/admin?guardada=${slugBase}` && p1.precio === 5200, `${r.status} precio=${p1.precio}`);
  check("editar sin cambiar el slug lo conserva", p1.slug === slugBase, p1.slug);
  r = await pedir(`/admin/propiedades/${crypto.randomUUID()}`, adm.cookie);
  check("editar una propiedad inexistente muestra 404", r.html.includes("Página no encontrada") || r.status === 404, `${r.status}`);

  // Listado, filtro y búsqueda
  r = await pedir("/admin", adm.cookie);
  check("el listado muestra borradores y publicadas", r.html.includes(p1.id) && r.html.includes(p2.id));
  r = await pedir("/admin?estado=publicada", adm.cookie);
  check("el filtro por estado deja solo ese estado", !r.html.includes(p1.id) && r.html.includes(p2.id));
  r = await pedir(`/admin?q=${encodeURIComponent(`CAVANCHÁ ${run}`)}`, adm.cookie);
  check("la búsqueda ignora tildes y mayúsculas", r.html.includes(p1.id) && r.html.includes(p2.id));
  r = await pedir(`/admin?q=${encodeURIComponent(`c-${run}`)}`, adm.cookie);
  check("la búsqueda encuentra por código", !r.html.includes(p1.id) && r.html.includes(p2.id));
  r = await pedir(`/admin?q=nada-${run}`, adm.cookie);
  check("una búsqueda sin resultados lo avisa", r.html.includes("No hay propiedades que coincidan"));

  // Acciones rápidas
  r = await enviar("/admin", adm.cookie, "estado", { estado: "vendida" }, { filtro: p1.id });
  [p1] = await filas();
  check("cambiar estado desde el listado", p1.estado === "vendida", `${r.status} ${p1.estado}`);
  r = await enviar("/admin", adm.cookie, "destacada", {}, { filtro: p1.id });
  [p1] = await filas();
  check("destacar desde el listado", p1.destacada === true, `${r.status}`);

  // Cuenta no admin: la acción de crear no crea nada
  r = await enviar("/admin/propiedades/nueva", adm.cookie, "titulo", datos({ titulo: `Intrusa ${run}` }), { cookieEnvio: otro.cookie });
  check(
    "una cuenta no admin no puede crear con la acción del panel",
    (await filas(`titulo=eq.Intrusa ${run}`)).length === 0 && destino(r) === "/admin/sin-acceso",
    `${r.status} ${destino(r)}`,
  );

  // Eliminar, con un archivo de foto en <id>/
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  const ruta = `${p1.id}/${crypto.randomUUID()}.png`;
  const subida = await fetch(`${API}/storage/v1/object/propiedades/${ruta}`, { method: "POST", headers: { apikey: SECRET, "Content-Type": "image/png" }, body: png });
  const foto = `${API}/storage/v1/object/public/propiedades/${ruta}`;
  check("(preparación) foto subida a la propiedad", subida.status === 200 && (await fetch(foto)).status === 200, `${subida.status}`);
  r = await enviar("/admin", adm.cookie, "$ACTION_REF_", {}, { filtro: p1.id });
  check("eliminar borra la propiedad", (await filas(`id=eq.${p1.id}`)).length === 0, `${r.status}`);
  check("eliminar borra sus archivos de fotos", (await fetch(foto)).status >= 400);
}

console.log(`App: ${APP}  ·  Supabase local: ${API}\n`);
const cuentas = [];
try {
  // Sin sesión
  let r = await pedir("/admin");
  check("sin sesión, /admin redirige al login", r.status === 307 && destino(r) === "/admin/login?next=%2Fadmin", `${r.status} ${destino(r)}`);
  r = await pedir("/admin/cuenta");
  check("sin sesión, /admin/cuenta redirige al login con next", r.status === 307 && destino(r) === "/admin/login?next=%2Fadmin%2Fcuenta", `${r.status} ${destino(r)}`);
  r = await pedir("/admin/login");
  check("el login responde 200 sin sesión", r.status === 200, `${r.status}`);
  check("el login pide no indexar", /<meta name="robots" content="noindex, nofollow"/.test(r.html));
  r = await pedir("/");
  check("la página de inicio no pasa por el proxy (sin redirección)", r.status === 200, `${r.status}`);

  const adm = await cuenta("admin", true);
  const otro = await cuenta("noadmin", false);
  cuentas.push(adm, otro);

  // Cuenta no admin. La guardia corre dentro de <Suspense>: la redirección llega en el HTML
  // (meta refresh de Next) y no como 307. Lo importante es que no viaje nada del panel,
  // tampoco dentro del payload RSC (<script>), donde Next serializa la página.
  const redirigeASinAcceso = (html) =>
    /<meta id="__next-page-redirect" http-equiv="refresh" content="\d+;url=\/admin\/sin-acceso"/.test(html);
  r = await pedir("/admin", otro.cookie);
  check("no admin en /admin es enviado a /admin/sin-acceso", redirigeASinAcceso(r.html), `${r.status}`);
  check("no admin no recibe contenido del panel", !r.html.includes(otro.email) && !r.html.includes("Sesión iniciada como"));
  r = await pedir("/admin/cuenta", otro.cookie);
  check("no admin en /admin/cuenta es enviado a /admin/sin-acceso", redirigeASinAcceso(r.html), `${r.status}`);
  check("no admin no recibe el formulario de contraseña", !r.html.includes("Contraseña actual"));
  r = await pedir("/admin/sin-acceso", otro.cookie);
  check("/admin/sin-acceso muestra el aviso", r.status === 200 && r.html.includes("Tu cuenta no tiene acceso al panel"), `${r.status}`);
  r = await pedir("/admin/sin-acceso");
  check("sin sesión, /admin/sin-acceso redirige al login", r.status === 307 && destino(r).startsWith("/admin/login"), `${r.status} ${destino(r)}`);

  // Admin
  r = await pedir("/admin", adm.cookie);
  check("el admin ve el panel con su correo", r.status === 200 && r.html.includes(adm.email) && !redirigeASinAcceso(r.html), `${r.status}`);
  check("el panel pide no indexar", /<meta name="robots" content="noindex, nofollow"/.test(r.html));
  r = await pedir("/admin/cuenta", adm.cookie);
  check("el admin ve el formulario de contraseña", r.status === 200 && r.html.includes("Contraseña actual"), `${r.status}`);
  r = await pedir("/admin/login", adm.cookie);
  check("con sesión, el login redirige al panel", r.status === 307 && destino(r) === "/admin", `${r.status} ${destino(r)}`);

  // Cookie alterada: se cambia el JWT por uno con otra firma
  const alterada = adm.cookie.replace(/=base64-([A-Za-z0-9_-]+)/, (_m, b64) => {
    const sesion = JSON.parse(Buffer.from(b64, "base64url").toString());
    const [h, p] = sesion.access_token.split(".");
    sesion.access_token = `${h}.${p}.firmaFalsa`;
    sesion.refresh_token = "invalido";
    return "=base64-" + Buffer.from(JSON.stringify(sesion)).toString("base64url");
  });
  check("la cookie de prueba quedó alterada", alterada !== adm.cookie);
  r = await pedir("/admin", alterada);
  check("con una sesión alterada, /admin redirige al login", r.status === 307 && destino(r).startsWith("/admin/login"), `${r.status} ${destino(r)}`);

  // Propiedades (spec 3), con la sesión del admin
  console.log("\n-- Propiedades");
  await propiedades(adm, otro);

  // Formularios: login
  console.log("\n-- Formularios");
  const conSesion = (c) => /sb-[^=]+-auth-token/.test(c);
  r = await enviar("/admin/login", "", "email", { email: adm.email, password: "Incorrecta-123" });
  check("login con contraseña incorrecta responde el error", r.html.includes("Correo o contraseña incorrectos.") && !conSesion(r.cookie), `${r.status}`);
  // React 19 vacía el formulario tras la acción: el correo vuelve en el estado (defaultValue).
  check("tras el error la acción devuelve el correo para no reescribirlo", r.html.includes(`"email":"${adm.email}"`));
  r = await enviar("/admin/login", "", "email", { email: `nadie-${run}@test.local`, password: "Incorrecta-123" });
  check("login con correo inexistente responde el mismo error", r.html.includes("Correo o contraseña incorrectos.") && !conSesion(r.cookie), `${r.status}`);
  r = await enviar("/admin/login?next=%2Fadmin%2Fcuenta", "", "email", { email: adm.email, password });
  check("login correcto vuelve a la página pedida", r.status === 303 && destino(r) === "/admin/cuenta" && conSesion(r.cookie), `${r.status} ${destino(r)}`);
  const cookieForm = r.cookie;
  r = await pedir("/admin", cookieForm);
  check("la sesión del formulario abre el panel", r.html.includes(adm.email));
  r = await enviar("/admin/login?next=%2F%2Fejemplo.com", "", "email", { email: adm.email, password });
  check("un destino fuera del panel termina en /admin", r.status === 303 && destino(r) === "/admin", `${r.status} ${destino(r)}`);

  // Cambio de contraseña
  const cambio = (actual, nueva, confirmacion = nueva, c = cookieForm) =>
    enviar("/admin/cuenta", cookieForm, "actual", { actual, nueva, confirmacion }, { cookieEnvio: c });
  r = await cambio("Incorrecta-123", "Nueva-clave-123");
  check("cambio con la contraseña actual incorrecta se rechaza", r.html.includes("La contraseña actual no es correcta."), `${r.status}`);
  r = await cambio(password, "Nueva-clave-123", "Otra-clave-123");
  check("cambio con confirmación distinta se rechaza", r.html.includes("Las contraseñas nuevas no coinciden."), `${r.status}`);
  r = await cambio(password, "Corta123");
  check("cambio a una contraseña de 8 caracteres se rechaza", r.html.includes("al menos 10 caracteres, con letras y dígitos"), `${r.status}`);
  r = await cambio(password, "Nueva-clave-123", "Nueva-clave-123", otro.cookie);
  check("un no admin no puede usar la acción de cambio de contraseña", !r.html.includes("Listo") && (r.status === 303 ? destino(r) === "/admin/sin-acceso" : true), `${r.status} ${destino(r)}`);
  r = await cambio(password, "Nueva-clave-123");
  check("cambio correcto confirma", r.html.includes("Listo: tu contraseña fue cambiada."), `${r.status}`);
  r = await enviar("/admin/login", "", "email", { email: adm.email, password: "Nueva-clave-123" });
  check("después del cambio entra con la contraseña nueva", r.status === 303, `${r.status}`);
  r = await enviar("/admin/login", "", "email", { email: adm.email, password });
  check("después del cambio la anterior ya no sirve", r.html.includes("Correo o contraseña incorrectos."), `${r.status}`);

  // Cierre de sesión
  // El botón de cerrar sesión es un form sin estado: su campo oculto es $ACTION_ID_<id>.
  r = await enviar("/admin", cookieForm, "$ACTION_ID_", {}, { filtro: "Cerrar sesión" });
  check("cerrar sesión lleva al login y borra la sesión", r.status === 303 && destino(r) === "/admin/login" && !conSesion(r.cookie), `${r.status} ${destino(r)}`);
  r = await pedir("/admin", r.cookie);
  check("después de cerrar sesión, /admin pide login", r.status === 307 && destino(r).startsWith("/admin/login"), `${r.status} ${destino(r)}`);
} finally {
  await admin("DELETE", `/rest/v1/propiedades?titulo=like.*${run}*`);
  for (const c of cuentas) await admin("DELETE", `/auth/v1/admin/users/${c.id}`);
}

console.log(`\n${fallas === 0 ? "Todos los controles OK" : `${fallas} control(es) fallaron`}`);
process.exit(fallas === 0 ? 0 : 1);
