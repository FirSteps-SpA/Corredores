# Spec Delta

## MODIFIED Requirements

### Requirement: Marca GyCmar en la página de inicio
La página de inicio SHALL mostrar el logo de GyCmar Propiedades Iquique y SHALL usar el nombre "GyCmar Propiedades Iquique" en todo texto que nombre a la corredora. Ninguna página SHALL mostrar el nombre "GC Propiedades".

#### Scenario: Visita a la página de inicio
- **WHEN** una persona abre la página de inicio del sitio
- **THEN** ve el logo de GyCmar Propiedades Iquique y el inicio del sitio público, no un aviso de sitio en construcción

#### Scenario: Nombre de la corredora
- **WHEN** se busca el texto "GC Propiedades" en las páginas generadas por el build
- **THEN** no aparece

### Requirement: Paleta y tipografía de la marca
El sitio SHALL usar la paleta de la marca (azul marino `#04142C`, dorado `#C89860`, crema y casi negro) y una tipografía serif para títulos y sans-serif para texto, definidas en un solo lugar y reutilizables por todas las páginas.

#### Scenario: Título de la página provisional
- **WHEN** se muestra el título principal de la página de inicio
- **THEN** usa la tipografía serif de la marca
