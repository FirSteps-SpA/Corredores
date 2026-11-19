# Proposal

## Why

El repo `Corredores` solo tiene un README y el material de referencia ignorado en `ref/`. Antes de modelar
propiedades (spec 1) hace falta la base sobre la que se construye todo lo demás: la app Next.js con la
identidad de GyCmar, Supabase local vinculado al proyecto remoto, CI y despliegue. Es la spec 0 del plan
(`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §5).

## What Changes

- App Next.js (App Router, TypeScript estricto, Tailwind, ESLint) con `src/` y alias `@/`.
- Identidad visual de GyCmar como tokens de Tailwind (azul marino, dorado, crema, tinta) y fuentes
  (serif para títulos, sans para texto) cargadas con `next/font`.
- Logos vectorizados copiados de `ref/logo/` a `public/brand/`; favicon e ícono de Apple en `src/app/`.
- Página de inicio provisional ("sitio en construcción") con el logo, en `es-CL`, con título y descripción
  de GyCmar. La reemplaza el sitio público de la spec 5.
- Clientes de Supabase para navegador y servidor (`@supabase/ssr`) con la clave **publishable**; sin
  clave secreta en la app.
- Supabase local (`supabase init`) con Auth configurado como en producción: **registro público
  desactivado** y contraseñas de mínimo 10 caracteres con letras y dígitos. Repo vinculado al proyecto
  `ioslqobvauapjpwhkgts`. Sin migraciones todavía.
- `npm run test:rls` con un primer control: el registro público está cerrado. La spec 1 le suma los
  controles de tablas y Storage.
- CI en GitHub Actions con jobs `build` (lint, typecheck, build) y `rls` (Supabase local +
  `test:rls`), en pushes y PR a `main` y `develop`.
- Despliegue en **Netlify** (plan gratis, permite uso comercial) desde `main`, sin deploy previews; Sentry
  para errores (solo si hay DSN).
- OpenSpec como devDependency, `.env.example`, README de desarrollo local y `ref/` fuera del repo.

## Capabilities

### New Capabilities
- `brand-shell`: la app se presenta con la marca GyCmar Propiedades Iquique (logo, colores, fuentes,
  favicon, idioma y metadatos), aunque todavía no tenga contenido.
- `closed-registration`: nadie puede crearse una cuenta por su cuenta; las cuentas de administración las
  crea el equipo a mano.

### Modified Capabilities
<!-- Ninguna: es la primera spec del proyecto. -->

## Impact

- **Dependencias**: `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`,
  `@sentry/nextjs`; dev: `typescript`, `tailwindcss`, `eslint`, `eslint-config-next`,
  `@fission-ai/openspec`.
- **Archivos nuevos**: estructura Next.js en `src/`, `public/brand/`, `supabase/config.toml`,
  `scripts/test-rls.mjs`, `.github/workflows/ci.yml`, `netlify.toml`, `.env.example`, configuración de
  Sentry.
- **Archivos modificados**: `.gitignore` (`/ref/`, `.env*.local`, Supabase), `README.md`.
- **Servicios externos** (los configura el usuario, ver tasks): sitio en Netlify, proyecto en Sentry,
  protección de ramas en GitHub y ajustes de Auth del proyecto Supabase remoto.
- **Sin impacto en**: base de datos remota (no se aplica ninguna migración).
