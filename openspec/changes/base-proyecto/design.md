# Design

## Context

- Repo `FirSteps-SpA/Corredores` (público) con `README.md` y `.gitignore`; `ref/` (mockup, JPEG del logo
  y logos vectorizados en `ref/logo/`) está ignorado y solo existe en el equipo local.
- Proyecto Supabase `ioslqobvauapjpwhkgts` en `sa-east-1`, Postgres 17, organización Pro. Registro
  público ya desactivado en el panel (verificado el 2026-11-19); faltan contraseñas, HIBP y URLs de Auth.
- Equipo local: Node 22.22.1 y npm 9.2.0. CI de VetApp usa Node 24; su lockfile se generó con npm 11
  porque npm 9 falla al resolver algunos peers.
- Versiones vigentes (npm, 2026-11-19): `next` 16.4, `react` 19.3, `tailwindcss` 4.3, `@supabase/ssr`
  0.12, `@sentry/nextjs` 11.14. OpenSpec 2.x exige Node ≥ 22.22.2, así que se usa 1.13.1, como VetApp.
- Referencias de convenciones: VetApp (`.github/workflows/ci.yml`, `scripts/test-rls.mjs`, gitmoji,
  `develop` → `main`).

## Goals / Non-Goals

**Goals:**
- `npm run dev` levanta el sitio con la marca contra Supabase local, siguiendo solo el README.
- Un PR a `develop` o `main` corre `build` y `rls` en verde sin tocar el proyecto remoto.
- Un push a `main` despliega en Netlify.

**Non-Goals:**
- Tablas, policies, bucket (spec 1), login y protección de `/admin` (spec 2), sitio público real (spec 5).
- Tests unitarios (Vitest): se agregan con la primera lógica propia (slugs, spec 3).
- Dominio propio, SMTP y UptimeRobot (spec 9).

## Decisions

1. **Next.js 16 con `create-next-app`**, no la 14 de VetApp. Proyecto nuevo sin deuda: se parte en la
   versión vigente (React 19, Tailwind 4, ESLint con config plana). Se genera en un directorio temporal
   con `--ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` y se copia al repo, sin
   pisar `.git`, `README.md`, `.gitignore`, `openspec/` ni `.claude/`. Las versiones de dependencias son
   las que fija ese generador (incluida la de TypeScript), no `latest` de cada paquete.
2. **Lockfile con npm 11** (`npx -y npm@11 install`), igual que VetApp, para que `npm ci` en Node 24 (CI y
   Netlify) resuelva igual que en local.
3. **Tokens de marca en Tailwind 4** con `@theme` en `src/app/globals.css`: `--color-marino #04142C`,
   `--color-oro #C89860`, `--color-oro-claro #E0B888`, `--color-crema #F3ECE3`, `--color-tinta #1A1A1A`,
   y `--font-serif` / `--font-sans` apuntando a las variables de `next/font`. Alternativa descartada:
   colores sueltos en cada componente (se desordenan con la spec 5).
4. **Fuentes con `next/font/google`**: Cormorant Garamond (títulos, con cursiva) e Inter (texto). Se
   autohospedan en el build: sin pedidos a Google desde el navegador.
5. **Logos e íconos**: `ref/logo/*.svg` → `public/brand/`; `gycmar-favicon.svg` → `src/app/icon.svg`;
   `gycmar-favicon-180.png` → `src/app/apple-icon.png`; `favicon.ico` de 32 px generado desde el PNG de
   32 (para navegadores sin SVG). Se borra el `favicon.ico` del generador. `ref/` sigue ignorado.
6. **Clientes Supabase con `@supabase/ssr`**: `src/lib/supabase/client.ts` (navegador) y `server.ts`
   (Server Components / acciones, con `cookies()`), con `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sin clave secreta en la app ni en Netlify. Sin `proxy.ts`
   (el reemplazo de `middleware.ts` en Next 16): llega con el login en la spec 2.
7. **Auth local = producción en lo que importa**: `supabase/config.toml` con `enable_signup = false` en
   `[auth]` (en `[auth.email]` queda en `true`: ahí desactiva el proveedor de correo completo y nadie
   podría iniciar sesión; comprobado al aplicar), `minimum_password_length = 10`, `password_requirements =
   "letters_digits"`, `site_url = "http://localhost:3000"`. **No se usa `supabase config push`**: subiría
   también `site_url` local y otros valores de desarrollo al proyecto remoto. Los ajustes remotos se hacen
   en el panel (tarea manual) y se verifican con `test:rls --remoto`.
8. **`scripts/test-rls.mjs` sin dependencias** (Node + `fetch`), como en VetApp. Lee URL y claves de
   `supabase status -o json`. Control de esta spec: `POST /auth/v1/signup` con la clave publishable
   responde error y la API de administración (clave secreta **local**) confirma que el correo no existe.
   Con `--remoto` corre solo la parte que no necesita clave secreta contra producción
   (`NEXT_PUBLIC_SUPABASE_URL`/`..._PUBLISHABLE_KEY` del entorno). La spec 1 agrega los controles de
   tablas y Storage al mismo script.
9. **CI** copiado de VetApp: jobs `build` (`npm ci`, `lint`, `tsc --noEmit`, `build`, con variables de
   relleno) y `rls` (`supabase/setup-cli@v1` versión fija 3.2.0, `supabase start` sin servicios
   innecesarios, `npm run test:rls`), Node 24, en push y PR a `main` y `develop`.
10. **Netlify** en lugar de Vercel: el plan Hobby de Vercel no permite uso comercial; Netlify gratis sí,
    y ya se usa con DentdeLion. `netlify.toml` con `npm run build`, Node 24 y el adaptador de Next.js que
    Netlify detecta solo (soporta ISR y `revalidatePath`). Rama de producción `main`; deploy previews y
    branch deploys desactivados (no hay proyecto Supabase de desarrollo en la nube).
11. **Sentry opcional por entorno**: proyecto `first-steps/corredores` (javascript-nextjs).
    `@sentry/nextjs` con `instrumentation.ts`, `instrumentation-client.ts` y `global-error.tsx`; opciones
    comunes en `sentry.opciones.ts`. Solo envía eventos en builds de producción con
    `NEXT_PUBLIC_SENTRY_DSN`; sube source maps solo con `SENTRY_AUTH_TOKEN`. Así el build de CI y el
    desarrollo local no dependen de Sentry. Errores, tracing (100 % con
    `NEXT_PUBLIC_SENTRY_ENVIRONMENT=local`, 10 % en producción), logs (activos por defecto en el SDK v11,
    más `console.warn/error` del servidor) y Session Replay **solo de sesiones con error**, como VetApp.
    Sin datos de usuario (`dataCollection`). Verificado el 2026-11-19 con un error de prueba desde
    `next start` local (issue `CORREDORES-1`).
12. **Página provisional** en `src/app/page.tsx`: fondo crema, logo vertical, "Sitio en construcción" y
    botón de WhatsApp solo si existe `NEXT_PUBLIC_WHATSAPP` (número de la corredora, pendiente). `lang`,
    `title` y `description` en `layout.tsx`.

## Risks / Trade-offs

- [Next 16 en Netlify: el adaptador puede ir detrás de Vercel en funciones nuevas] → el sitio usa
  funciones estables (App Router, ISR, `revalidatePath`); si algo falla, Vercel Pro queda como plan B.
- [npm 9 local] → lockfile con npm 11 (decisión 2); conviene actualizar Node local a 24 aparte.
- [`next/font/google` descarga fuentes en el build] → si Google no responde, el build falla; reintentar.
  Alternativa si se repite: fuentes locales con `next/font/local`.
- [El repo es público] → nada de claves en el repo; `.env*.local` ignorado; la clave publishable no es
  secreta, la secreta nunca sale del equipo.
- [`supabase link` guarda el ref en `supabase/.temp/`] → ignorado en git (lo genera el CLI).

## Migration Plan

Sin datos ni migraciones. Despliegue: merge `feat/base-proyecto` → `develop` (CI) → `main` (Netlify
publica la página provisional). Rollback: revertir el merge; Netlify vuelve al deploy anterior desde su
panel.

## Open Questions

- Número de WhatsApp de la corredora (`NEXT_PUBLIC_WHATSAPP`): sin él, la página provisional no muestra
  el botón.
