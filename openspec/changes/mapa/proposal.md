# Proposal

## Why

Quien busca propiedad en Iquique quiere ver dónde está (cerca de la playa, en qué sector), y la
corredora no tiene cómo indicar la ubicación: el modelo tiene `lat`/`lng` pero el panel no las pide y la
ficha no muestra mapa. Además, al revisar la privacidad antes de agregar coordenadas se encontró que **la
dirección oculta se puede leer por la API pública** (la clave publishable está en el navegador): el sitio
no la muestra, pero el dato es accesible. Es la spec 8 del plan
(`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §3 riesgo "Dirección exacta
expuesta", §4 y §5).

## What Changes

- **Panel**: en el formulario de la propiedad, un mapa para marcar la ubicación (clic o arrastrar el
  marcador), con un botón "Ubicar por dirección" que busca la dirección y la comuna, y la opción de
  quitar la ubicación.
- **Ficha pública**: sección "Ubicación" con mapa (OpenStreetMap). Si la corredora permite mostrar la
  dirección, marcador en el punto exacto; si no, un círculo de ~500 m alrededor de un punto desplazado
  (la ubicación real queda dentro, pero no se puede deducir). Sin coordenadas, no hay mapa.
- **Privacidad en la base**: el sitio público lee una vista `propiedades_publicas` que entrega la
  dirección y las coordenadas exactas solo si `mostrar_direccion`, y si no, sin dirección y con
  coordenadas aproximadas. La clave pública sin sesión pierde acceso directo a `direccion`, `lat` y
  `lng` de la tabla.
- Datos estructurados: coordenadas (`geo`) solo cuando la ubicación exacta es pública.

## Capabilities

### New Capabilities
- `property-map`: cómo la corredora marca la ubicación de una propiedad y cómo se muestra en la ficha,
  exacta o aproximada.

### Modified Capabilities
- `catalog-access`: se agrega que la dirección y la ubicación exacta de una propiedad que no permite
  mostrarlas no son legibles con la clave pública, ni siquiera llamando a la API.

## Impact

- **Base de datos**: migración con la vista `propiedades_publicas`, función de ubicación aproximada y
  permisos por columna. Se aplica en producción con visto bueno.
- **Dependencias**: `leaflet` 1.9.4 y `@types/leaflet`.
- **Archivos nuevos**: migración, componentes de mapa (panel y ficha), `src/lib/ubicacion.ts`,
  `e2e/mapa.spec.ts`.
- **Archivos modificados**: `src/lib/propiedades/publico.ts` (lee la vista), esquema y formulario de la
  propiedad (`lat`/`lng`), ficha, `src/lib/seo.ts`, `scripts/test-rls.mjs`, tipos generados, README.
- **Servicios externos**: teselas de OpenStreetMap y búsqueda de direcciones de Nominatim (gratuitos,
  con atribución y bajo volumen).
