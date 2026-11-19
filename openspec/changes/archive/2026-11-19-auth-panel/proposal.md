# Proposal

## Why

La spec 1 dejó la base lista y protegida por RLS, pero la corredora todavía no tiene cómo entrar: no hay
pantalla de login ni panel. Antes del CRUD de propiedades (spec 3) hace falta que pueda iniciar sesión,
que `/admin` quede cerrado para cualquier otra persona y que su cuenta exista en producción. Es la spec 2
del plan (`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §2, §4 y §5).

## What Changes

- Pantalla de login en `/admin/login` con correo y contraseña, con la marca de GyCmar.
- Panel `/admin` protegido: sin sesión redirige al login; con sesión de una cuenta que no es admin
  muestra que no tiene acceso; con la cuenta admin muestra un panel inicial (la lista de propiedades
  llega en la spec 3).
- Cerrar sesión y cambiar la propia contraseña desde el panel, para que la corredora reemplace la
  contraseña inicial que le entrega el equipo.
- `proxy.ts` (el `middleware.ts` de Next 16) que refresca la sesión en `/admin` y hace la redirección
  rápida; la comprobación definitiva se hace en el servidor al renderizar el panel.
- Páginas de `/admin` fuera de los buscadores (`noindex`).
- Controles automáticos del panel contra `next start` y Supabase local en el job `rls` de CI.
- Alta de la cuenta de la corredora en producción (usuario confirmado + fila en `admins`).

## Capabilities

### New Capabilities
- `admin-auth`: cómo entra y sale la corredora del panel, qué ve quien no tiene sesión o no es admin,
  y cómo cambia su contraseña.

### Modified Capabilities
<!-- Ninguna: `closed-registration` (cuentas creadas por el equipo) y `catalog-access` no cambian. -->

## Impact

- **Archivos nuevos**: `src/proxy.ts`, `src/lib/supabase/proxy.ts`, rutas en `src/app/admin/`,
  `scripts/test-panel.mjs`.
- **Archivos modificados**: `package.json` (script `test:panel`), `.github/workflows/ci.yml` (build y
  `next start` dentro del job `rls`), README.
- **Producción**: se crea la cuenta de la corredora (Auth) y su fila en `admins`. Requiere su correo y
  visto bueno explícito.
- **Sin impacto en**: esquema y policies (spec 1), página de inicio provisional.
