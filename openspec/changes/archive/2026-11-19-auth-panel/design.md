# Design

## Context

- Next.js 16.4 (App Router): `middleware.ts` pasó a llamarse **`proxy.ts`** (misma función; en `src/`).
  La guía de autenticación de Next recomienda usarlo solo para chequeos optimistas y verificar la sesión
  cerca de los datos.
- `src/lib/supabase/server.ts` ya existe (cookies con `@supabase/ssr`, tipado con `Database`); su
  `setAll` ignora el error de escribir cookies desde un Server Component, dejando el refresco al proxy.
- Spec 1: `es_admin()` disponible por RPC; RLS ya impide a quien no es admin leer borradores o escribir.
  El panel es la capa de experiencia: **la barrera de los datos sigue siendo RLS**.
- Auth: registro cerrado, contraseñas de 10+ con letras y dígitos (local = producción). Sin SMTP propio
  hasta tener dominio (spec 9): el SMTP de Supabase solo envía a miembros del equipo y con límite bajo.
- Referencia: VetApp `src/lib/supabase/middleware.ts` (patrón oficial de `@supabase/ssr` para refrescar
  la sesión).

## Goals / Non-Goals

**Goals:**
- La corredora entra, sale y cambia su contraseña; nadie más ve el panel.
- Controles automáticos de las redirecciones y del acceso por rol contra la app real en CI.

**Non-Goals:**
- Magic link y "olvidé mi contraseña" por correo: requieren SMTP con dominio (spec 9). Mientras, si la
  corredora olvida su contraseña, el equipo le asigna una temporal desde el panel de Supabase.
- Lista y formulario de propiedades (spec 3). El panel de esta spec es un inicio con la cuenta.
- Varios usuarios o roles (fuera de la v1).

## Decisions

1. **Solo correo y contraseña.** Alternativa descartada: magic link (depende del correo, que hoy no
   tenemos). La contraseña inicial la genera el equipo y la corredora la cambia al entrar (decisión 7).
2. **Rutas**: `src/app/admin/layout.tsx` (marca y `robots: { index: false, follow: false }` para todo
   `/admin`), `src/app/admin/login/page.tsx` y un grupo `src/app/admin/(panel)/` con su `layout.tsx`
   (solo el marco: logo y cerrar sesión), `page.tsx` (`/admin`), `cuenta/page.tsx` (`/admin/cuenta`,
   cambio de contraseña) y `sin-acceso/page.tsx` (`/admin/sin-acceso`, aviso para cuentas no admin,
   sin datos). El grupo deja el login fuera del marco del panel sin cambiar las URLs.
3. **`src/proxy.ts`** con `matcher: ["/admin/:path*"]` (no corre en el sitio público, que será
   estático/ISR). Usa `src/lib/supabase/proxy.ts`, que crea el cliente con el puente de cookies
   request/response del patrón oficial y llama a `auth.getClaims()` (valida la firma del JWT y refresca
   la sesión si venció el access token). Sin claims y fuera de `/admin/login` → redirección a
   `/admin/login?next=<ruta>`. Con claims en `/admin/login` → redirección a `/admin`. No consulta
   `admins`: el rol se decide en el servidor (decisión 4).
4. **Comprobación definitiva en el servidor, en cada página y acción**: `src/lib/auth.ts` con
   `obtenerSesion()` envuelta en `React.cache` (una vez por request: `getClaims()` y, si hay sesión,
   `rpc("es_admin")`) y `exigirAdmin()`, que redirige al login sin sesión y a `/admin/sin-acceso` si la
   cuenta no es admin. **Cada página del panel y cada server action llama a `exigirAdmin()`**; el
   layout no protege nada. Se probó primero con la guardia en el layout y `test:panel` mostró que no
   sirve: Next serializa la página en el payload RSC como segmento aparte aunque el layout no
   renderice `children`, así que el correo y el contenido del panel llegaban al no admin dentro de un
   `<script>`. Una action, además, se puede invocar sin pasar por ninguna página.
   Con `cacheComponents` (activo desde la spec 0), lo que lee la sesión va dentro de `<Suspense>`: cada
   página envuelve su contenido y la redirección de `exigirAdmin()` llega en el HTML (meta refresh de
   Next) en vez de un 307. Las redirecciones sin sesión sí son 307 porque las hace el proxy.
   `createClient()` del servidor llama a `await connection()`: el cliente de Supabase usa `Date.now()`
   al leer la sesión, que Next no admite durante el prerender aunque haya cookies.
5. **Server actions con `useActionState`** en `src/app/admin/acciones.ts`: `iniciarSesion`,
   `cerrarSesion` y `cambiarContrasena`. El navegador nunca habla con Supabase Auth directamente.
   Mensajes:
   - Login fallido: siempre "Correo o contraseña incorrectos." (`invalid_credentials` y cualquier otro
     4xx), salvo `over_request_rate_limit` → "Demasiados intentos. Espera unos minutos.". El estado
     devuelve el correo para usarlo como `defaultValue`: React 19 vacía el formulario tras cada acción
     y, sin eso, había que reescribirlo (lo detectó la prueba en el navegador).
   - Cambio de contraseña: valida que las nuevas coincidan; verifica la actual con
     `signInWithPassword` sobre el mismo correo; `updateUser({ password })` y traduce `weak_password` a
     "Debe tener al menos 10 caracteres, con letras y dígitos.".
6. **Destino tras el login (`next`)**: se acepta solo si empieza con `/admin`, no con `//` ni
   `/admin/login`; si no, `/admin`. Evita redirecciones abiertas.
7. **Alta de la corredora en producción**: el equipo la crea en el panel de Supabase (Authentication ›
   Add user, **Auto Confirm**) con una contraseña temporal aleatoria (`openssl rand -base64 18`, que
   cumple la política), registra la fila en `admins` con SQL y le entrega la contraseña por un canal
   distinto al del correo. Ella la cambia en `/admin/cuenta` la primera vez.
8. **Controles automáticos `scripts/test-panel.mjs`** (Node, sin navegador): crea un admin y un no admin
   en Supabase local con la clave secreta, inicia sesión **con `@supabase/ssr` en Node** usando un
   almacén de cookies en memoria (así obtiene las cookies con el mismo formato que lee la app) y hace
   `fetch` con `redirect: "manual"` contra `next start`:
   - sin cookies: `/admin`, `/admin/cuenta` y `/admin/sin-acceso` → 307 a `/admin/login?next=…`;
     `/admin/login` → 200 con `noindex`;
   - no admin: `/admin` y `/admin/cuenta` → redirección a `/admin/sin-acceso` **sin** su correo ni el
     contenido del panel en ninguna parte de la respuesta (incluido el payload RSC);
   - admin: `/admin` → 200 con su correo; `/admin/login` → 307 a `/admin`;
   - cookie alterada → 307 al login.
   - Formularios: se envían como un navegador sin JavaScript (POST multipart con los campos ocultos que
     React pone en el HTML, que traen el id de la action del build actual): login correcto, incorrecto,
     correo inexistente, `next` seguro, cambio de contraseña en cada caso, la action de cambio llamada
     por un no admin, y cierre de sesión. Se verifica la respuesta de la action (redirección, cookies y
     estado); cómo se dibuja en pantalla se revisó con Playwright en local, fuera del repo.
   Alternativa descartada: Playwright en el repo y en CI (descarga de navegadores y una dependencia más
   para cinco pantallas). Se reevalúa con el formulario de propiedades (spec 3).
9. **CI**: el job `rls` (nombre fijo: lo exige la protección de `main`) suma `npm ci`, exporta URL y clave
   publishable desde `supabase status -o env` a `$GITHUB_ENV`, hace `npm run build`, levanta `npm start`
   en segundo plano, espera a que responda y corre `npm run test:panel`.

## Risks / Trade-offs

- [Lo que dibujan los formularios no tiene test automático] → `test:panel` prueba la respuesta de cada
  action; el dibujo se revisó en un navegador real. Si crecen (spec 3), se evalúa Playwright.
- [Sin JavaScript los formularios envían pero no muestran errores] → con `cacheComponents`, Next no
  vuelca el estado de la action en el HTML de la respuesta, solo en el payload RSC. El panel lo usa una
  persona con un navegador normal: aceptado.
- [Contraseña temporal en tránsito] → canal distinto del correo y cambio obligatorio pedido en la
  entrega; no se puede forzar técnicamente sin más código. Aceptado para una sola cuenta.
- [Sin recuperación por correo] → el equipo resetea desde el panel; se agrega con SMTP en la spec 9.
- [`getClaims()` con claves JWT simétricas hace una llamada a Auth en cada request de `/admin`] → solo
  afecta al panel, de uso bajo.

## Migration Plan

1. Local: `npm run test:rls`, `npm run test:panel` contra `next start`, y prueba a mano de login, cierre
   y cambio de contraseña.
2. PR `feat/auth-panel` → `develop` con CI en verde; release a `main` (Netlify publica `/admin`).
3. Con visto bueno explícito y el correo de la corredora: alta en producción (decisión 7) y prueba de
   login en https://gycmar.netlify.app/admin.

Rollback: revertir el merge; la cuenta de producción puede quedar (sin panel no tiene uso) o borrarse
desde el panel.

## Open Questions

- Correo de la corredora para su cuenta: se necesita solo para la tarea de producción.
