# Tasks

## 1. Sesión y proxy

- [x] 1.1 Crear `src/lib/supabase/proxy.ts` (cliente con puente de cookies request/response y `getClaims()`) y `src/proxy.ts` con `matcher: ["/admin/:path*"]` y las redirecciones de la decisión 3. Verificar con `curl -I` contra `npm run dev` que `/admin` sin cookies responde 307 a `/admin/login?next=%2Fadmin` y que `/` no pasa por el proxy.
- [x] 1.2 Crear `src/lib/auth.ts` con `obtenerSesion()` (`React.cache`, `getClaims()` + `rpc("es_admin")`) y la validación de `next` (decisión 6). Verificar con `npm run typecheck`.

## 2. Pantallas

- [x] 2.1 `src/app/admin/layout.tsx` con `robots` `noindex, nofollow` y la marca; `src/app/admin/login/page.tsx` con formulario de correo y contraseña. Verificar en el navegador que la página se ve con la marca y que su HTML tiene `<meta name="robots" content="noindex, nofollow">`.
- [x] 2.2 Grupo `src/app/admin/(panel)/`: `layout.tsx` (marco con logo y cerrar sesión), `page.tsx` con el correo de la cuenta y enlace a cambiar contraseña, `sin-acceso/page.tsx`, y `exigirAdmin()` en cada página (decisión 4). Verificar en el navegador con una cuenta admin y otra no admin de Supabase local.
- [x] 2.3 `src/app/admin/(panel)/cuenta/page.tsx` con el formulario de contraseña actual, nueva y confirmación. Verificar en el navegador cada escenario del requisito "Cambio de la propia contraseña".

## 3. Acciones

- [x] 3.1 `src/app/admin/acciones.ts` con `iniciarSesion`, `cerrarSesion` y `cambiarContrasena` (decisión 5) y conectarlas a los formularios con `useActionState`. Verificar en el navegador: login correcto, contraseña incorrecta y correo inexistente con el mismo mensaje, vuelta a la página pedida, `next=//ejemplo.com` que termina en `/admin`, y cierre de sesión que vuelve a pedir login.

## 4. Controles automáticos

- [x] 4.1 Crear `scripts/test-panel.mjs` y el script `npm run test:panel` con los controles de la decisión 8 (admin y no admin creados y borrados por el script; aborta si la URL no es local). Verificar que pasan contra `npm run build && npm start` y que fallan si se quita temporalmente `exigirAdmin()` de una página (revertir después).
- [x] 4.2 Sumar al job `rls` de `.github/workflows/ci.yml` `npm ci`, variables desde `supabase status -o env`, `npm run build`, `npm start` en segundo plano con espera y `npm run test:panel` (decisión 9). Verificar en el PR que `rls` termina en verde y que su log muestra los controles del panel.

## 5. Documentación y PR

- [x] 5.1 README: panel, alta de la corredora (decisión 7), reset de contraseña por el equipo, `test:panel`. Verificar siguiendo los pasos con una cuenta local nueva.
- [x] 5.2 Commit gitmoji y PR de `feat/auth-panel` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 6. Producción

- [x] 6.1 (Con visto bueno explícito y el correo de la corredora) Release a `main` y verificar que https://gycmar.netlify.app/admin redirige al login.
- [x] 6.2 (Con visto bueno explícito) Crear la cuenta de la corredora en el panel de Supabase con Auto Confirm y contraseña temporal, y registrar su fila en `admins`. Verificar entrando a https://gycmar.netlify.app/admin con esa cuenta y que `es_admin()` la reconoce.

Avance (2026-11-19): release PR #7 (`4ab93cf`); en Netlify `/admin` sin sesión → 307 a `/admin/login?next=%2Fadmin`, login 200 con `noindex`. La cuenta `gycmarpropiedadesiquique@gmail.com` la creó el usuario en el panel (confirmada); su fila en `admins` se registró por SQL. El usuario confirmó el ingreso al panel en producción con esa cuenta (6.2).

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 2 en el plan, roadmap y backlog de 1stDocs; sumar "olvidé mi contraseña" con SMTP a la spec 9.
