# brand-shell Specification

## Purpose
Garantiza que cualquier página del sitio se presente con la identidad de GyCmar Propiedades Iquique (nombre, logo, colores, tipografía, favicon e idioma), desde la primera versión desplegada y antes de que exista el sitio público completo.

## Requirements

### Requirement: Marca GyCmar en la página de inicio
La página de inicio SHALL mostrar el logo de GyCmar Propiedades Iquique y SHALL usar el nombre "GyCmar Propiedades Iquique" en todo texto que nombre a la corredora. Ninguna página SHALL mostrar el nombre "GC Propiedades".

#### Scenario: Visita a la página de inicio
- **WHEN** una persona abre la página de inicio del sitio
- **THEN** ve el logo de GyCmar Propiedades Iquique y un aviso de que el sitio está en construcción

#### Scenario: Nombre de la corredora
- **WHEN** se busca el texto "GC Propiedades" en las páginas generadas por el build
- **THEN** no aparece

### Requirement: Paleta y tipografía de la marca
El sitio SHALL usar la paleta de la marca (azul marino `#04142C`, dorado `#C89860`, crema y casi negro) y una tipografía serif para títulos y sans-serif para texto, definidas en un solo lugar y reutilizables por todas las páginas.

#### Scenario: Título de la página provisional
- **WHEN** se muestra el título de la página de inicio
- **THEN** usa la tipografía serif y el azul marino de la marca

### Requirement: Favicon e ícono
El sitio SHALL servir el favicon de GyCmar (isotipo dorado sobre azul marino) para pestañas del navegador y un ícono de 180 × 180 px para accesos directos en iOS.

#### Scenario: Pestaña del navegador
- **WHEN** se abre cualquier página en un navegador de escritorio
- **THEN** la pestaña muestra el isotipo de GyCmar, no el ícono por defecto de Next.js ni de Vercel

### Requirement: Idioma y metadatos
Toda página SHALL declarar el idioma `es-CL` y SHALL tener título y descripción que identifiquen a GyCmar Propiedades Iquique como corredora de propiedades en Iquique.

#### Scenario: Metadatos de la página de inicio
- **WHEN** se inspecciona el HTML de la página de inicio
- **THEN** el elemento `html` tiene `lang="es-CL"` y el `title` contiene "GyCmar Propiedades Iquique"
