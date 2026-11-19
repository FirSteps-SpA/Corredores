# Proposal

## Why

La corredora ya entra al panel (spec 2), pero no tiene dónde cargar sus propiedades. Esta spec le da el
listado y el formulario para crear, editar, cambiar de estado, destacar y eliminar propiedades, para que
empiece a llenar el catálogo mientras se construye el sitio público (specs 4–5). Es la spec 3 del plan
(`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §4 y §5).

## What Changes

- `/admin` pasa a ser el **listado de propiedades**: filtro por estado, búsqueda por código o título,
  y acciones rápidas (cambiar estado, destacar, eliminar con confirmación).
- **Formulario** de crear y editar (`/admin/propiedades/nueva`, `/admin/propiedades/[id]`) con todos los
  datos del modelo salvo coordenadas (llegan con el mapa, spec 8): título, slug (se genera del título y
  es editable), código, operación, tipo, precio y moneda, gastos comunes, ubicación, dirección y si se
  muestra, superficies y cantidades, características, estado y destacada.
- Validación en el servidor con un esquema compartido; los errores se muestran junto a cada campo.
- Slug único: si el generado ya existe, se le agrega un sufijo numérico.
- Al eliminar una propiedad se borran también sus archivos de fotos en Storage (aunque las fotos llegan
  en la spec 4, el borrado queda completo desde ya).
- Cada cambio invalida la caché del catálogo con una etiqueta (`propiedades`) que usará el sitio
  público.
- El encabezado del panel muestra el correo de la cuenta y el enlace a cambiar contraseña.
- Tests unitarios (Vitest) para slug, formato de precio y validación; `test:panel` suma los controles
  del CRUD.

## Capabilities

### New Capabilities
- `property-admin`: cómo la corredora lista, busca, crea, edita, cambia de estado, destaca y elimina
  propiedades desde el panel, y qué validaciones ve.

### Modified Capabilities
<!-- Ninguna: `admin-auth` se sigue cumpliendo (el correo y el cambio de contraseña pasan al
     encabezado del panel, que el admin ve en todas las páginas). -->

## Impact

- **Dependencias nuevas**: `zod` (validación); dev: `vitest`.
- **Archivos nuevos**: `src/lib/propiedades/` (esquema, slug, formato, consultas), rutas en
  `src/app/admin/(panel)/propiedades/`, tests unitarios.
- **Archivos modificados**: `src/app/admin/(panel)/page.tsx` y `layout.tsx`, `scripts/test-panel.mjs`,
  `package.json`, CI (`npm test` en el job `build`), README.
- **Base de datos**: sin migraciones; usa el esquema y RLS de la spec 1.
- **Sin impacto en**: página de inicio provisional (el sitio público es la spec 5).
