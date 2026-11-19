# Proposal

## Why

El sitio público ya muestra el catálogo (spec 5), pero quien busca no puede acotar: ni por operación,
tipo, comuna o precio, ni ordenar, y el buscador del hero del mockup quedó pendiente. Con un catálogo que
crece, encontrar "un departamento en arriendo en Cavancha bajo $700.000" debe ser directo y compartible
por WhatsApp. Es la spec 6 del plan
(`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §4 y §5).

## What Changes

- **Filtros en `/propiedades`**: operación, tipo, comuna, sector, rango de precio, dormitorios y baños
  mínimos, y "ocultar vendidas y arrendadas". Todo en la URL (se puede compartir) y funciona sin
  JavaScript (formulario GET).
- **Orden**: relevantes (el actual), precio menor a mayor, precio mayor a menor, más recientes.
- **Paginación**: 12 propiedades por página, con la cantidad de resultados.
- **Precio comparable entre monedas**: el rango se expresa en UF o en pesos; las propiedades en la otra
  moneda se convierten con la **UF del día** (findic.cl, sin clave, cacheada un día). Sin la API, un
  valor de respaldo configurado; sin ninguno, el rango compara solo propiedades en la misma moneda.
- **Buscador del hero** según el mockup: tipo, comuna y rango de precio (rangos por operación) que lleva
  al listado filtrado.
- Opciones de comuna y sector tomadas del propio catálogo (solo las que tienen propiedades visibles).

## Capabilities

### New Capabilities
- `property-search`: cómo el público filtra, ordena y pagina el catálogo, cómo se compara el precio entre
  UF y pesos, y cómo funciona el buscador del inicio.

### Modified Capabilities
<!-- Ninguna: `public-site` describe el listado sin filtros, que sigue siendo el comportamiento por
     defecto (sin parámetros, el listado es igual al de la spec 5). -->

## Impact

- **Archivos nuevos**: `src/lib/propiedades/filtros.ts` (lectura de la URL, filtrado, orden, paginación,
  rangos del hero) con tests, `src/lib/uf.ts` (valor UF cacheado), componentes de filtros y paginación,
  `e2e/busqueda.spec.ts`.
- **Archivos modificados**: `/propiedades` (filtros dentro de `<Suspense>`), inicio (buscador del hero),
  `.env.example`, CI (`UF_FUENTE=ninguna` y `UF_RESPALDO` para pruebas deterministas), README.
- **Netlify**: variable de servidor nueva y opcional: `UF_RESPALDO`.
- **Base de datos**: sin migraciones.
