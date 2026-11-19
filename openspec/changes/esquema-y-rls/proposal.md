# Proposal

## Why

El proyecto todavía no tiene base de datos: sin tablas no se puede construir el panel de la corredora
(specs 2–4) ni el sitio público (spec 5). Esta spec fija el modelo de propiedades y, sobre todo, la regla
de seguridad central del sitio: **el público solo lee lo publicado y solo la corredora escribe**,
expresada en RLS y probada en CI antes de que exista una sola pantalla. Es la spec 1 del plan
(`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §3 y §5).

## What Changes

- Migraciones en `supabase/migrations/` con las tablas `propiedades`, `propiedad_fotos` y `admins` del
  plan (§3), con sus restricciones (operación, moneda, tipo, estado, slug, valores no negativos) y
  `updated_at` automático.
- Características extra (piscina, quincho, amoblado…) como lista de textos en la propiedad.
- Función `es_admin()` que identifica a la corredora por la tabla `admins`.
- Policies RLS: el público y cualquier usuario no admin ven las propiedades que no son borrador y sus
  fotos, y no pueden escribir nada; el admin puede todo.
- Bucket de Storage `propiedades`: fotos servidas por URL pública, escritura solo del admin, límite de
  tamaño y solo imágenes.
- `npm run test:rls` suma los controles de tablas y Storage para público, usuario no admin y admin.
- Tipos de TypeScript generados desde el esquema para usarlos en las specs siguientes.
- Aplicación de las migraciones en producción, con visto bueno explícito.

## Capabilities

### New Capabilities
- `property-catalog`: qué datos tiene una propiedad y sus fotos, qué valores son válidos y en qué estados
  puede estar.
- `catalog-access`: quién puede ver y quién puede modificar propiedades y fotos (público, usuario no
  admin, admin).
- `photo-storage`: dónde viven los archivos de las fotos, cómo se sirven y quién puede subirlos o
  borrarlos.

### Modified Capabilities
<!-- Ninguna: `closed-registration` y `brand-shell` no cambian. -->

## Impact

- **Archivos nuevos**: `supabase/migrations/*.sql`, `src/lib/supabase/database.types.ts`.
- **Archivos modificados**: `scripts/test-rls.mjs` (controles de tablas y Storage), clientes de
  `src/lib/supabase/` (tipados), `package.json` (script para regenerar tipos), README.
- **Base de datos remota**: se aplican las migraciones al proyecto `ioslqobvauapjpwhkgts` (tablas vacías,
  sin datos que migrar). Requiere visto bueno explícito antes de `supabase db push`.
- **CI**: el job `rls` ya levanta Supabase local con las migraciones; corre los controles nuevos sin
  cambios en el workflow (Storage ya está entre los servicios activos).
- **Sin impacto en**: la página provisional, Auth y Netlify.
