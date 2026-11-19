# Tasks

## 1. Base

- [x] 1.1 `src/lib/seo.ts` (`descripcionFicha`, `imagenCompartir`, JSON-LD de corredora y ficha) con tests de Vitest. Verificar con `npm test`.
- [x] 1.2 `public/compartir.jpg` 1200 × 630 (decisión 2). Verificar tamaño y peso (< 150 KB) y revisarla a ojo.

## 2. Metadatos

- [x] 2.1 Layout raíz: `metadataBase`, Open Graph y Twitter por defecto; canónicas en inicio, listado, Servicios, Nosotros y Contacto. Verificar en el HTML con `curl`.
- [x] 2.2 Ficha: `generateMetadata` con imagen, descripción y canónica; JSON-LD de la ficha. Inicio: JSON-LD de la corredora. Verificar en el HTML con `curl`.
- [x] 2.3 `src/app/sitemap.ts` y `src/app/robots.ts`. Verificar `/sitemap.xml` y `/robots.txt` contra `next start`.

## 3. Pruebas

- [x] 3.1 `e2e/seo.spec.ts` (decisión 8). Verificar que pasan y que el de dirección oculta falla si el JSON-LD incluye siempre la dirección (revertir después).
- [x] 3.2 Verificar que `lint`, `typecheck`, `test`, `test:rls`, `test:panel` y `test:e2e` pasan.

## 4. Documentación y PR

- [x] 4.1 README: metadatos, sitemap, robots, JSON-LD, imagen de marca. Verificar leyendo el README contra el código.
- [ ] 4.2 Commit gitmoji y PR de `feat/seo-y-compartir` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 5. Producción

- [ ] 5.1 (Con visto bueno explícito) Release a `main`. Verificar `/sitemap.xml`, `/robots.txt` y metadatos con `curl`; (usuario) enviar por WhatsApp el enlace de una ficha publicada y ver la vista previa con foto.

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 7 en el plan, roadmap y backlog de 1stDocs; registrar Search Console para la spec 9.
