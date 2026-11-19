# Proposal

## Why

La corredora ya carga propiedades (spec 3), pero sin fotos: una propiedad sin fotos no se puede
publicar. Esta spec le permite subir, ordenar, elegir la portada y borrar las fotos de cada propiedad
desde el panel, comprimiéndolas en su dispositivo para que suban rápido desde el celular y no inflen el
almacenamiento. Es la spec 4 del plan
(`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §4 y §5).

## What Changes

- Sección **Fotos** en la página de cada propiedad del panel: subida de varias fotos a la vez, vista de
  miniaturas en su orden, mover antes/después, marcar como portada (la primera) y borrar con
  confirmación. Los cambios se guardan al momento, sin el botón "Guardar" del formulario.
- **Compresión en el navegador** antes de subir: lado mayor de 1600 px, JPEG de calidad 0,8, respetando
  la orientación de la cámara. Formatos aceptados: JPEG, PNG y WebP (las fotos HEIC del iPhone llegan
  convertidas por el propio navegador).
- Subida **directa del navegador a Storage** con la sesión de la corredora (RLS: solo el admin escribe)
  y registro de la foto en la base con una server action.
- Al **crear** una propiedad, el panel lleva a su página para agregar fotos (en vez de al listado).
- El listado del panel muestra la miniatura de portada de cada propiedad.
- **Playwright** en el repo y en CI para probar la subida, el orden, la portada y el borrado en un
  navegador real.

## Capabilities

### New Capabilities
- `property-photos`: cómo la corredora sube, ordena, elige la portada y borra las fotos de una
  propiedad, y qué pasa con el tamaño y el formato de cada foto.

### Modified Capabilities
- `property-admin`: después de crear una propiedad el panel lleva a su página para agregar fotos, no al
  listado; el listado muestra la portada.

## Impact

- **Dependencias**: dev `@playwright/test` (versión fija). Sin librerías nuevas en la app: compresión con
  APIs del navegador y orden con botones (ver design).
- **Archivos nuevos**: `src/lib/fotos/` (compresión, rutas, URLs), componente de fotos y acciones en
  `src/app/admin/(panel)/propiedades/[id]/`, `e2e/` con la configuración de Playwright.
- **Archivos modificados**: acción `guardarPropiedad` (destino tras crear), listado (miniatura),
  `consultas.ts`, CI (Playwright en el job `rls`), README, `.gitignore`.
- **Base de datos**: sin migraciones (tabla `propiedad_fotos` y bucket de la spec 1).
