# Corredores

Sitio web de **GyCmar Propiedades Iquique**: la corredora administra sus propiedades desde un panel
privado y el público las ve y contacta por WhatsApp.

Next.js (App Router) + TypeScript + Tailwind, Supabase (Auth, Postgres con RLS, Storage) y Netlify.
Plan del proyecto: `1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`.

## Requisitos

- Node 22.22 o superior (CI y Netlify usan Node 24).
- npm 11 para tocar dependencias (`npx -y npm@11 install …`): con npm 9 el lockfile resuelve distinto.
- Docker y [Supabase CLI](https://supabase.com/docs/guides/cli).

## Desarrollo local

Siempre contra Supabase local; nunca contra producción.

```bash
npm install
supabase start          # stack local en los puertos 553xx (convive con VetApp/DentdeLion)
cp .env.example .env.local
supabase status         # copia la "Publishable key" a NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev             # http://localhost:3000
```

`supabase start` aplica las migraciones de `supabase/migrations/`; `supabase db reset` borra la base
local y las vuelve a aplicar.

El registro público está desactivado. Para tener una cuenta local, créala en Studio
(`supabase start` sin `-x studio`, Authentication › Add user, con **Auto Confirm User**). Para que sea
admin (puede escribir propiedades y fotos), regístrala en `admins` desde el SQL Editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'corredora@ejemplo.cl';
```

En producción se hace igual, en el SQL Editor del panel. Las cuentas que no estén en `admins` solo ven
lo mismo que el público.

## Panel (`/admin`)

- `/admin/login`: correo y contraseña (sin magic link ni recuperación por correo hasta tener SMTP con
  dominio). `/admin`: inicio del panel. `/admin/cuenta`: cambio de contraseña (pide la actual).
- `src/proxy.ts` refresca la sesión en `/admin/*` y redirige al login si no hay sesión; es solo un
  chequeo rápido. **Cada página y server action del panel llama a `exigirAdmin()`**
  (`src/lib/auth.ts`); no basta con el layout, porque Next envía la página al navegador aunque el
  layout no la muestre. Las cuentas que no son admin van a `/admin/sin-acceso`.

**Alta de la corredora** (producción): en el panel de Supabase, Authentication › Add user, con
**Auto Confirm User** y una contraseña temporal (`openssl rand -base64 18`); registrar su fila en
`admins` (SQL de arriba) y entregarle la contraseña por un canal distinto del correo. Ella la cambia en
`/admin/cuenta`.

**Si olvida su contraseña** (no hay recuperación por correo hasta tener SMTP): asignarle una temporal con
la API de administración de Auth y la clave secreta del proyecto (panel › Project Settings › API Keys),
desde el equipo y nunca desde la app; ella la cambia al entrar.

```bash
TEMP=$(openssl rand -base64 18); echo "$TEMP"   # la que se le entrega
curl -X PUT "$SUPABASE_URL/auth/v1/admin/users/<user_id>" \
  -H "apikey: $SECRET_KEY" -H "Content-Type: application/json" \
  -d "{\"password\": \"$TEMP\"}"
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | Genera los tipos de rutas (`next typegen`) y corre `tsc --noEmit` |
| `npm run build` | Build de producción |
| `npm run test:rls` | Controles de seguridad contra Supabase local: registro cerrado, contraseñas, y acceso a propiedades, fotos y Storage como público, usuario no admin y admin |
| `npm run test:rls -- --remoto` | Contra producción, solo lo que no necesita clave secreta (registro cerrado). Usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del entorno |
| `npm run test:panel` | Controles del panel contra la app corriendo (`npm run build && npm start`) y Supabase local: redirecciones, acceso por rol, noindex y formularios |
| `npm run db:types` | Regenera `src/lib/supabase/database.types.ts` desde Supabase local. Correrlo tras cada migración |

## Supabase

- Proyecto de producción: `ioslqobvauapjpwhkgts` (`sa-east-1`). Vincular con
  `supabase link --project-ref ioslqobvauapjpwhkgts`.
- Esquema solo por migraciones en `supabase/migrations/` (`supabase db push`). Nada a mano en el panel.
- Tablas: `propiedades`, `propiedad_fotos` y `admins`. El público (y cualquier cuenta que no sea admin)
  ve lo que no está en `borrador`; solo las cuentas en `admins` escriben (`es_admin()` en las
  policies).
- Bucket `propiedades` (público, solo JPEG/PNG/WebP de hasta 10 MB): las fotos se sirven por URL
  pública; solo el admin sube, borra o lista. Rutas `<propiedad_id>/<uuid>.<ext>`.
- La app usa solo la clave **publishable**; los permisos los da RLS. La clave secreta no va en la app
  ni en Netlify.
- `supabase/config.toml` replica los ajustes de Auth de producción (registro cerrado, contraseñas de
  10+ caracteres con letras y dígitos). No usar `supabase config push`: subiría valores de desarrollo.
  Los ajustes remotos se cambian en el panel y se verifican con `npm run test:rls -- --remoto`.

## Ramas y specs

- Specs con OpenSpec (`openspec/changes/<id>`, comandos `/opsx:*`).
- Cada spec en `feat/<id>`, PR a `develop`; `develop` → `main` para publicar.
- Commits gitmoji: `:sparkles: feat: …`, `:bug: fix: …`, `:memo: docs: …`.
- CI (GitHub Actions): jobs `build` (lint, typecheck, build) y `rls` (Supabase local + `test:rls`).

## Despliegue

Netlify publica `main` en https://gycmar.netlify.app (`netlify.toml`, con el adaptador
`@netlify/plugin-nextjs` explícito). Sin deploy previews: no hay proyecto Supabase de desarrollo en
la nube. Variables en Netlify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_WHATSAPP` y, para Sentry, `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_AUTH_TOKEN`.

## Marca

Logos vectorizados en `public/brand/` (vertical y horizontal, para fondo claro y oscuro, e isotipo);
favicon e ícono de Apple en `src/app/`. Colores y fuentes como tokens en `src/app/globals.css`. El
material original (mockup, JPEG) está en `ref/`, fuera del repo.
