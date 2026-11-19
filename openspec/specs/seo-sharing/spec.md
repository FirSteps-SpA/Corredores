# seo-sharing Specification

## Purpose
Define cómo se presentan las páginas del sitio al compartirlas en WhatsApp y redes sociales, y qué información reciben los buscadores para indexar las propiedades de GyCmar, de modo que cada enlace compartido muestre la propiedad y cada propiedad visible pueda encontrarse en Google.

## Requirements

### Requirement: Vista previa de una ficha al compartirla
Al compartir el enlace de una propiedad visible, la vista previa SHALL mostrar su portada, su título y una descripción con operación, tipo, sector o comuna y precio. La imagen SHALL ser una URL absoluta, de 1200 píxeles de ancho como máximo y liviana para que WhatsApp la muestre. Si la propiedad no tiene fotos, SHALL usarse la imagen de marca.

#### Scenario: Ficha con fotos
- **WHEN** se comparte por WhatsApp el enlace de una casa en venta en Cavancha de UF 5.200 con fotos
- **THEN** la vista previa muestra su portada, el título y "Venta de casa en Cavancha, Iquique. UF 5.200."

#### Scenario: Ficha sin fotos
- **WHEN** se comparte el enlace de una propiedad sin fotos
- **THEN** la vista previa muestra la imagen de marca de GyCmar

### Requirement: Vista previa de las demás páginas
El inicio, el listado y las páginas de contenido SHALL tener título, descripción e imagen de marca para compartir, con el nombre del sitio "GyCmar Propiedades Iquique" e idioma español de Chile.

#### Scenario: Compartir el inicio
- **WHEN** se comparte el enlace del inicio
- **THEN** la vista previa muestra la imagen de marca, "GyCmar Propiedades Iquique" y la descripción del sitio

### Requirement: Mapa del sitio
El sitio SHALL publicar `/sitemap.xml` con el inicio, el listado, Servicios, Nosotros, Contacto y la ficha de cada propiedad que no esté en borrador, con su fecha de última modificación. Ninguna página del panel ni ficha de borrador SHALL aparecer. El mapa SHALL reflejar los cambios del panel igual que el resto del sitio.

#### Scenario: Propiedad publicada
- **WHEN** la corredora publica una propiedad
- **THEN** su ficha aparece en el mapa del sitio en la siguiente consulta

#### Scenario: Borrador
- **WHEN** una propiedad está en borrador
- **THEN** su ficha no aparece en el mapa del sitio

### Requirement: Instrucciones para buscadores
El sitio SHALL publicar `/robots.txt` que permita indexar el sitio público, excluya `/admin` e indique la dirección del mapa del sitio.

#### Scenario: Panel excluido
- **WHEN** un buscador lee `/robots.txt`
- **THEN** encuentra que `/admin` no debe recorrerse y la URL de `/sitemap.xml`

### Requirement: Datos estructurados
El inicio SHALL describir a la corredora como agente inmobiliario (nombre, sitio, logo, ciudad y contactos configurados). Cada ficha visible SHALL describir la propiedad como publicación inmobiliaria con su nombre, descripción, fotos, ubicación (sin la dirección exacta si no se permite mostrarla) y oferta con precio y moneda (UF como `CLF`, pesos como `CLP`); una propiedad vendida o arrendada SHALL indicar que la oferta ya no está disponible.

#### Scenario: Dirección oculta
- **WHEN** una ficha no permite mostrar la dirección
- **THEN** sus datos estructurados tampoco incluyen la dirección

#### Scenario: Precio en UF
- **WHEN** una propiedad cuesta UF 5.200
- **THEN** sus datos estructurados indican precio 5200 y moneda `CLF`

### Requirement: URL canónica
Cada página pública SHALL declarar su URL canónica absoluta. El listado con filtros u orden SHALL declarar como canónica la del listado sin parámetros.

#### Scenario: Listado filtrado
- **WHEN** un buscador abre `/propiedades?operacion=arriendo`
- **THEN** la página declara como canónica `/propiedades`
