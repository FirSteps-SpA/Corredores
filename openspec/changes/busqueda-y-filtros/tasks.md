# Tasks

## 1. Lógica

- [x] 1.1 `src/lib/propiedades/filtros.ts` (`leerFiltros`, `filtrar`, `ordenar`, `paginar`, `enMoneda`, expansión de `rango`) con tests de Vitest de cada escenario de la spec. Verificar con `npm test`.
- [x] 1.2 `src/lib/uf.ts` (`valorUF` cacheado desde findic.cl, `obtenerUF` con respaldo, parser) con tests del parser y del respaldo. Verificar con `npm test` y `npm run typecheck`.

## 2. Pantallas

- [x] 2.1 `/propiedades` con formulario de filtros y orden, resultados y paginación, render bloqueante sin `<Suspense>` (decisiones 1, 7, 8). Verificar en el navegador con y sin JavaScript, en escritorio y 390 px.
- [x] 2.2 Buscador del hero en el inicio (decisión 6), con rangos en `src/contenido/sitio.ts`. Verificar en el navegador.

## 3. Pruebas y CI

- [x] 3.1 `e2e/busqueda.spec.ts` (decisión 9). Verificar que pasan contra `next start` con `UF_RESPALDO=40000`, y que el de venta en pesos dentro de un rango en UF falla si se quita la conversión (revertir después).
- [x] 3.2 CI: `UF_FUENTE=ninguna` y `UF_RESPALDO=40000` en el job `rls`; `.env.example` con `UF_RESPALDO` y `UF_FUENTE`. Verificar con `yaml-lint` y que `lint`, `typecheck`, `test`, `test:rls`, `test:panel` y `test:e2e` pasan.

## 4. Documentación y PR

- [x] 4.1 README: filtros, parámetros de la URL, UF (findic.cl, respaldo). Verificar leyendo el README contra el código.
- [x] 4.2 Commit gitmoji y PR de `feat/busqueda-y-filtros` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 5. Producción

- [x] 5.1 (Usuario, opcional) Agregar `UF_RESPALDO` en Netlify con un valor cercano al del día. Verificar en la configuración del sitio.
- [ ] 5.2 (Con visto bueno explícito) Release a `main`. Verificar en https://gycmar.netlify.app filtros, orden, paginación y buscador del hero, y que la conversión use la UF del día de findic.cl.

Avance (2026-11-19): el usuario agregó `UF_RESPALDO` en Netlify (5.1). Release PR #19 (`6b25aba`). En producción: buscador en el inicio; `/propiedades` responde 200 con filtros, `rango`, página fuera de rango y valores inválidos, con el formulario en el HTML (sin fragmentos ocultos). Producción tiene solo un borrador: falta que el usuario pruebe los resultados con propiedades publicadas (idealmente una en UF y otra en pesos) para cerrar 5.2.

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 6 en el plan, roadmap y backlog de 1stDocs.
