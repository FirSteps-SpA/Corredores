# Design

## Context

- Spec 5: `listadoPublico()` (`"use cache"`, etiqueta `propiedades`) entrega todas las tarjetas visibles
  ya ordenadas con `ordenPublico()`; `/propiedades` es estático y se invalida desde el panel.
- `cacheComponents`: `searchParams` es dato de request; lo que lo lee va en `<Suspense>`. En Netlify, el
  "App Shell" para **params** nuevos falla (spec 5), pero las páginas con agujeros dinámicos dentro de
  `<Suspense>` (todo el panel) funcionan.
- Catálogo de decenas de propiedades: filtrar en memoria sobre el listado cacheado es trivial.
- UF: mindicador.cl no respondió el 2026-11-19 (respuesta vacía desde dos redes). La API oficial de la
  CMF exige `apikey` y no se pudieron confirmar los pasos de registro. **findic.cl** (`/api/uf`) responde
  sin clave con la serie diaria (`{"serie":[{"fecha":"2026-11-19","valor":41364.17},…]}`); es un servicio
  de terceros, no oficial. Decisión del usuario: findic.cl.
- Tarjeta pública (`Tarjeta`) no incluye estacionamientos; tiene precio, moneda, dormitorios, baños,
  comuna, sector, operación, tipo, estado, destacada y `updated_at`.

## Goals / Non-Goals

**Goals:**
- Filtros, orden y paginación compartibles por URL, sin JavaScript obligatorio.
- Precio comparable entre UF y pesos sin tocar el modelo de datos.

**Non-Goals:**
- Búsqueda de texto libre, mapa de resultados (spec 8), alertas de búsqueda o favoritos (fuera de v1).
- Precio en otra moneda en las tarjetas (se muestra siempre en la moneda publicada).
- Filtro por características (piscina, etc.): `text[]` lo permitiría; se agrega si se pide.

## Decisions

1. **Filtrado en el servidor sobre el listado cacheado.** `/propiedades` espera `searchParams` en la
   página, **sin `<Suspense>`**, con `export const instant = false` (render bloqueante, completo en cada
   visita). Se probó primero con `<Suspense>`: Next envía ese contenido como HTML oculto que mueve con
   JavaScript, y **sin JavaScript los filtros y resultados no se veían** (lo detectó el test sin JS). Dentro: `listadoPublico()` (caché)
   → `filtrar()` → `ordenar()` → `paginar()`. El HTML llega ya filtrado (enlace compartido correcto, sin
   parpadeo, sin JavaScript). Alternativa descartada: filtrar en el cliente con `useSearchParams` (mostraría
   todo y luego filtraría; dependería de JavaScript).
2. **Lógica pura en `src/lib/propiedades/filtros.ts`** con tests de Vitest:
   - `leerFiltros(searchParams)`: valida cada parámetro contra las listas cerradas y números ≥ 0; lo
     inválido se ignora. Parámetros: `operacion`, `tipo`, `comuna`, `sector`, `desde`, `hasta`,
     `moneda` (`UF`|`CLP`, por defecto UF salvo `operacion=arriendo`), `dormitorios`, `banos`,
     `disponibles=1`, `orden` (`relevantes`|`precio-asc`|`precio-desc`|`recientes`), `pagina`, y `rango`
     (del hero, ver 6).
   - `filtrar(tarjetas, filtros, uf)`, `ordenar(tarjetas, orden, uf)` (cerradas siempre al final; por
     defecto `ordenPublico`), `paginar(lista, pagina, 12)` (página fuera de rango → la última).
   - Comparación de texto sin tildes ni mayúsculas para comuna y sector (`normalizar` de la spec 3).
3. **Conversión**: `enMoneda(precio, de, a, uf)`; con `uf = null`, una propiedad en otra moneda no entra en
   un rango de precio (y en el orden por precio va después de las de la misma moneda).
4. **Valor UF en `src/lib/uf.ts`**: `valorUF()` con `"use cache"`, `cacheTag("uf")` y un perfil `uf`
   (`stale: 3600, revalidate: 86400, expire: 604800`). Pide `https://findic.cl/api/uf` con `fetch`
   `no-store` (lección de la spec 5) y timeout de 5 s, y toma el primer valor de `serie` (validado: número
   entre 10.000 y 200.000). Si falla, **lanza**: en una renovación en segundo plano Next sigue sirviendo
   el último valor bueno (hasta 7 días). `obtenerUF()` (sin caché) envuelve la llamada: ante error usa
   `UF_RESPALDO` (variable de servidor) y si tampoco hay, `null`. `UF_FUENTE=ninguna` desactiva la
   consulta (CI y pruebas, con `UF_RESPALDO=40000`: resultados deterministas y sin red externa). Si
   findic.cl deja de funcionar, la alternativa es la API de la CMF con clave.
5. **Opciones de comuna y sector** desde `listadoPublico()` (valores distintos, ordenados); el sector se
   ofrece completo (sin depender de la comuna elegida, para no requerir JavaScript).
6. **Buscador del hero** (formulario GET a `/propiedades`): tipo, comuna y un `<select name="rango">` con
   `<optgroup>` "Venta (UF)" (hasta 3.000 · 3.000–5.000 · 5.000–8.000 · más de 8.000) y "Arriendo"
   (hasta $400.000 · $400.000–$700.000 · $700.000–$1.000.000 · más de $1.000.000). `rango` codifica
   `operacion:moneda:desde:hasta` (p. ej. `arriendo:CLP:0:700000`) y `leerFiltros` lo expande; los
   filtros explícitos de la URL tienen prioridad. El formulario del listado no usa `rango`. Rangos en
   `src/contenido/sitio.ts` para ajustarlos con la corredora. El hero necesita las comunas: el inicio
   ya lee el listado cacheado.
7. **Formulario del listado**: `<form method="get">` con selects e inputs (`inputMode="numeric"`), botón
   "Filtrar" y enlace "Limpiar". En celular, los filtros se pliegan con un checkbox + `label` (CSS
   `peer-checked`), abierto si hay filtros activos; en escritorio siempre visibles. Un `<details>`
   cerrado ocultaba el formulario también en escritorio (CSS no puede mostrar su contenido). El orden es un `<select>` del mismo formulario. Sin JavaScript propio.
8. **Paginación**: enlaces "Anterior / 1 2 3 / Siguiente" con los mismos parámetros y `pagina=n`
   (`URLSearchParams`). Contador "N propiedades".
9. **Pruebas Playwright `e2e/busqueda.spec.ts`**: preparación de ~14 propiedades con la clave secreta e
   invalidación por el panel (como en la spec 5). Casos: cada filtro de la spec, URL compartida con el
   formulario marcado, dormitorios mínimos sin dato, venta en pesos dentro de un rango en UF (UF de
   respaldo 40.000), orden por precio con cerradas al final, página 2 y fuera de rango, valor inválido
   ignorado, buscador del hero y uso sin JavaScript (`javaScriptEnabled: false`).

## Risks / Trade-offs

- [findic.cl es de terceros y puede caer o cambiar de formato] → último valor cacheado hasta 7 días,
  luego `UF_RESPALDO`, luego comparación en la misma moneda; el parser valida el rango del valor.
  Alternativa: CMF con clave.
- [`/propiedades` deja de ser totalmente estático] → el título y el encabezado siguen en el shell; los
  resultados se calculan en cada visita sobre datos cacheados (sin consultas a Supabase).
- [Agujeros dinámicos en Netlify] → el panel ya los usa en producción; se verifica igual en la tarea de
  producción.

## Migration Plan

Sin migraciones. PR → `develop`, release a `main`. En Netlify, opcional: `UF_RESPALDO` con un valor
cercano al del día. Verificar filtros y buscador en producción.

## Open Questions

- Rangos del buscador del hero: propuestos; se ajustan con la corredora en `src/contenido/sitio.ts`.
