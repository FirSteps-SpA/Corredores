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

El registro público está desactivado. Para tener una cuenta local, créala en Studio
(`supabase start` sin `-x studio`, Authentication › Add user, con **Auto Confirm User**).

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | Genera los tipos de rutas (`next typegen`) y corre `tsc --noEmit` |
| `npm run build` | Build de producción |
| `npm run test:rls` | Controles de seguridad contra Supabase local (registro cerrado, contraseñas; luego RLS) |
| `npm run test:rls -- --remoto` | Lo mismo contra producción, solo lo que no necesita clave secreta. Usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del entorno |

## Supabase

- Proyecto de producción: `ioslqobvauapjpwhkgts` (`sa-east-1`). Vincular con
  `supabase link --project-ref ioslqobvauapjpwhkgts`.
- Esquema solo por migraciones en `supabase/migrations/` (`supabase db push`). Nada a mano en el panel.
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

Netlify publica `main` (`netlify.toml`). Sin deploy previews: no hay proyecto Supabase de desarrollo en
la nube. Variables en Netlify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_WHATSAPP` y, para Sentry, `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_AUTH_TOKEN`.

## Marca

Logos vectorizados en `public/brand/` (vertical y horizontal, para fondo claro y oscuro, e isotipo);
favicon e ícono de Apple en `src/app/`. Colores y fuentes como tokens en `src/app/globals.css`. El
material original (mockup, JPEG) está en `ref/`, fuera del repo.
