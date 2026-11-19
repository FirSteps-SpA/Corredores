// Controles de seguridad contra Supabase LOCAL (`supabase start`), vía la API real.
// Spec 0: registro público cerrado y contraseñas robustas. La spec 1 suma tablas y Storage.
//
// Uso:
//   npm run test:rls                 contra el stack local (lee claves de `supabase status`)
//   npm run test:rls -- --remoto     contra producción, solo lo que no necesita clave secreta;
//                                    usa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
//
// En modo local aborta si la URL no es 127.0.0.1/localhost. Cada ejecución usa emails nuevos,
// así que puede repetirse sin `supabase db reset`.

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

async function http(method, path, { key = PUB, token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      apikey: key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
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

console.log(`\n${fallas === 0 ? "Todos los controles OK" : `${fallas} control(es) fallaron`}`);
process.exit(fallas === 0 ? 0 : 1);
