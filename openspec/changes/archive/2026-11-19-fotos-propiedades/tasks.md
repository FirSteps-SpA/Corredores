# Tasks

## 1. Fotos: lógica

- [x] 1.1 `src/lib/fotos/rutas.ts` (`urlPublica`, `rutaNueva`, constante de máximo 30) con tests de Vitest. Verificar con `npm test`.
- [x] 1.2 `src/lib/fotos/comprimir.ts` (decisión 1). Verificar con `npm run typecheck` (se prueba en navegador en 4.2).

## 2. Acciones y consultas

- [x] 2.1 Acciones `registrarFoto`, `ordenarFotos` y `eliminarFoto` (decisiones 2, 5, 6, 7), todas con `exigirAdmin()`. Verificar con `npm run typecheck`.
- [x] 2.2 `consultas.ts`: fotos de una propiedad ordenadas y portada en el listado (decisión 9). Verificar con `npm run typecheck`.
- [x] 2.3 `guardarPropiedad` redirige a `/admin/propiedades/<id>?creada=1` al crear (decisión 8) y actualizar los controles de alta de `test:panel`. Verificar con `test:panel`.

## 3. Pantallas

- [x] 3.1 Componente de fotos en `/admin/propiedades/[id]` (decisiones 3–6): subida múltiple con estado por foto, miniaturas, ◀ ▶, Portada, Borrar con confirmación, aviso de límite y de archivo no válido; aviso "Propiedad creada". Verificar en el navegador con fotos reales de celular (horizontal y vertical). Hecho con imágenes generadas (4000 × 3000 y vertical con EXIF de orientación 6); las fotos reales del celular de la corredora se prueban en 6.1.
- [x] 3.2 Miniatura de portada en el listado. Verificar en el navegador.

## 4. Playwright

- [x] 4.1 Instalar `@playwright/test@1.64.1` (exacta, con `npx -y npm@11`), `playwright.config.ts`, `npm run test:e2e`, `.gitignore` de resultados. Verificar que `npx playwright test --list` encuentra los tests.
- [x] 4.2 `e2e/fotos.spec.ts` con los casos de la decisión 10 y el de cuenta no admin de la decisión 11. Verificar que pasan contra `next start` y que el de cuenta no admin falla si se quita temporalmente `exigirAdmin()` de `ordenarFotos` (revertir después).
- [x] 4.3 CI: en el job `rls`, después de `test:panel`, instalar Chromium con caché y correr `npm run test:e2e`; subir el reporte si falla. Verificar en el PR que `rls` termina en verde y que su log muestra los tests de Playwright.

## 5. Documentación y PR

- [x] 5.1 README: fotos (compresión, subida directa, límite), `test:e2e` y cómo correrlo en local. Verificar que `lint`, `typecheck`, `test`, `build`, `test:rls`, `test:panel` y `test:e2e` pasan.
- [x] 5.2 Commit gitmoji y PR de `feat/fotos-propiedades` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 6. Producción

- [x] 6.1 (Con visto bueno explícito) Release a `main`. Verificar con el usuario, desde el celular de la corredora, subir fotos desde la galería y la cámara, ordenarlas, elegir portada y borrar una.

Avance (2026-11-19): release PR #11 (`064ae2e`) con `build` y `rls` en verde. El usuario confirmó la prueba en producción desde el celular de la corredora (6.1).

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 4 en el plan, roadmap y backlog de 1stDocs.
