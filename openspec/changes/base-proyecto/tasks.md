# Tasks

## 1. App Next.js

- [x] 1.1 Generar la app con `npx create-next-app@16` en un directorio temporal (`--ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`) y copiarla al repo sin pisar `.git`, `README.md`, `.gitignore`, `openspec/` ni `.claude/`. Verificar que existen `package.json`, `src/app/layout.tsx` y `src/app/page.tsx`.
- [x] 1.2 Regenerar `package-lock.json` con `npx -y npm@11 install` y agregar `@fission-ai/openspec@1.13.1` como devDependency. Verificar que `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [x] 1.3 Completar `.gitignore`: `/ref/` (cambio local ya existente), `.env*.local`, `supabase/.temp/`, `supabase/.branches/`. Verificar con `git status` que `ref/` y `.env.local` no aparecen.

## 2. Marca

- [x] 2.1 Copiar `ref/logo/*.svg` a `public/brand/`, `gycmar-favicon.svg` a `src/app/icon.svg` y `gycmar-favicon-180.png` a `src/app/apple-icon.png`; generar `src/app/favicon.ico` (32 px) desde `gycmar-favicon-32.png` y borrar el del generador. Verificar que `/icon.svg` y `/apple-icon.png` responden 200 en `npm run dev`.
- [x] 2.2 Definir los tokens de marca con `@theme` en `src/app/globals.css` (marino, oro, oro claro, crema, tinta, fuentes) y cargar Cormorant Garamond e Inter con `next/font/google` en `layout.tsx`. Verificar que `npm run build` pasa.
- [x] 2.3 `layout.tsx`: `lang="es-CL"`, `title` y `description` de GyCmar Propiedades Iquique. Página provisional en `page.tsx` (fondo crema, logo vertical, "Sitio en construcción", botón de WhatsApp solo con `NEXT_PUBLIC_WHATSAPP`). Verificar en el navegador y que `grep -r "GC Propiedades" .next/server/app` no encuentra nada tras el build.

## 3. Supabase

- [x] 3.1 `supabase init` y ajustar `supabase/config.toml`: `enable_signup = false` en `[auth]` (no en `[auth.email]`, que apaga el login por correo), `minimum_password_length = 10`, `password_requirements = "letters_digits"`, `site_url = "http://localhost:3000"`. Verificar que `supabase start` levanta sin errores.
- [x] 3.2 Vincular con `supabase link --project-ref ioslqobvauapjpwhkgts` (lo ejecuta el usuario si pide la contraseña de la base). Verificar que existe `supabase/.temp/project-ref` con ese ref.
- [x] 3.3 Instalar `@supabase/ssr` y `@supabase/supabase-js` y crear `src/lib/supabase/client.ts` y `server.ts` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Crear `.env.example` documentado (Supabase, sitio, WhatsApp, Sentry). Verificar que `npx tsc --noEmit` pasa y que `.env.example` no tiene valores reales.
- [x] 3.4 Crear `scripts/test-rls.mjs` y el script `npm run test:rls`: registro con la clave publishable rechazado y, con la clave secreta local, el correo no existe. Opción `--remoto` (solo el rechazo, con la clave publishable del entorno). Verificar que pasa contra Supabase local y que falla si se pone `enable_signup = true` (revertir después).
- [x] 3.5 Ejecutar `npm run test:rls -- --remoto` contra producción y verificar que el registro se rechaza.

## 4. Sentry

- [x] 4.1 Instalar `@sentry/nextjs` y configurar `instrumentation.ts`, `instrumentation-client.ts` y `next.config.ts`: inicializar solo con `NEXT_PUBLIC_SENTRY_DSN`, subir source maps solo con `SENTRY_AUTH_TOKEN`, sin Replay ni datos de usuario. Verificar que `npm run build` pasa sin ninguna variable de Sentry.
- [x] 4.2 Crear el proyecto `first-steps/corredores` en Sentry, agregar logs, Replay solo con error y `global-error.tsx`. Verificar con un error de prueba desde `next start` local que llega a Sentry (`CORREDORES-1`) y borrar la ruta de prueba.

## 5. CI

- [x] 5.1 Crear `.github/workflows/ci.yml` con jobs `build` (Node 24: `npm ci`, `lint`, `tsc --noEmit`, `build` con variables de relleno) y `rls` (Supabase CLI 3.2.0, `supabase start` sin servicios innecesarios, `npm run test:rls`), en push y PR a `main` y `develop`. Verificar la sintaxis con `npx --yes yaml-lint .github/workflows/ci.yml`.

## 6. Netlify

- [x] 6.1 Crear `netlify.toml` (comando `npm run build`, Node 24). Verificar que `npm run build` local sigue pasando.
- [ ] 6.2 (Usuario) Crear el sitio en Netlify desde el repo: rama de producción `main`, deploy previews y branch deploys desactivados, variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y, si existe, `NEXT_PUBLIC_SENTRY_DSN`. Verificar después del merge a `main` que la URL de Netlify muestra la página provisional con favicon.

## 7. Documentación y PR

- [x] 7.1 Reescribir `README.md`: requisitos, `.env.local`, `supabase start`, `npm run dev`, `test:rls`, ramas y despliegue. Verificar siguiendo el README desde cero que el sitio levanta.
- [x] 7.2 Commit gitmoji y PR de `feat/base-proyecto` a `develop`. Verificar que los jobs `build` y `rls` terminan en verde.
- [x] 7.3 (Usuario, con `gh` o desde GitHub) Proteger `main` exigiendo `build` y `rls`, sin force push. Verificar en Settings › Branches.
- [x] 7.4 (Usuario) En el panel de Supabase: contraseñas de mínimo 10 con letras y dígitos, protección contra contraseñas filtradas, Site URL con la URL de Netlify y Redirect URLs `http://localhost:3000/**` y la de Netlify. Verificar repitiendo 3.5.

## Workflow follow-up

- Archivar el change con `/opsx:archive` cuando el PR esté mergeado.
- Marcar la spec 0 como ✅ en el plan de 1stDocs y cambiar Vercel por Netlify en sus decisiones de base.
