# Spec Delta

## Purpose

Define el sitio que ve el público general: cómo descubre las propiedades de GyCmar en el inicio y el listado, qué información encuentra en la ficha de cada una, cómo contacta a la corredora y qué contenido institucional ve, siempre reflejando lo que la corredora publicó en el panel.

## ADDED Requirements

### Requirement: Encabezado y pie comunes
Toda página pública SHALL tener un encabezado con el logo, enlaces a Inicio, Propiedades, Servicios, Nosotros y Contacto, y un botón "Escríbenos" que abre WhatsApp; y un pie con el logo, la ciudad, los datos de contacto configurados y el lema "Confianza que construye patrimonio.". En pantallas angostas el menú SHALL seguir siendo accesible.

#### Scenario: Navegación desde cualquier página
- **WHEN** una persona abre cualquier página pública
- **THEN** ve el encabezado con los cinco enlaces y el botón "Escríbenos", y el pie con el lema

#### Scenario: Celular
- **WHEN** una persona abre el sitio en un celular
- **THEN** puede abrir el menú y llegar a cualquiera de las cinco secciones

### Requirement: Inicio
La página de inicio SHALL mostrar el lema "Tu propiedad. Nuestro compromiso.", "Compra • Vende • Arrienda" y un acceso al listado; hasta tres propiedades disponibles (publicadas o reservadas), primero las destacadas y luego las más recientes; los cuatro valores de la corredora; la sección "Sobre nosotros" con acceso a Nosotros; y la invitación "¿Hablamos?" con acceso a WhatsApp. Si no hay propiedades disponibles, la sección de propiedades SHALL omitirse.

#### Scenario: Con propiedades destacadas
- **WHEN** hay dos propiedades destacadas publicadas y otras cuatro publicadas sin destacar
- **THEN** el inicio muestra las dos destacadas y la más reciente de las demás

#### Scenario: Borradores y vendidas no aparecen en el inicio
- **WHEN** una propiedad destacada está en borrador o vendida
- **THEN** no aparece entre las propiedades del inicio

### Requirement: Listado de propiedades
El listado SHALL mostrar todas las propiedades que no están en borrador, como tarjetas con portada, operación, título, dormitorios, baños, superficie y precio. Las disponibles (publicadas y reservadas) SHALL ir primero, destacadas arriba y luego por última modificación; las vendidas y arrendadas SHALL ir al final con su etiqueta visible. Las reservadas SHALL mostrar la etiqueta "Reservada".

#### Scenario: Orden del listado
- **WHEN** hay una vendida modificada hoy y una publicada modificada ayer
- **THEN** la publicada aparece antes que la vendida

#### Scenario: Borrador
- **WHEN** una propiedad está en borrador
- **THEN** no aparece en el listado

#### Scenario: Propiedad sin fotos
- **WHEN** una propiedad visible no tiene fotos
- **THEN** su tarjeta muestra un marcador con la marca en lugar de la portada

### Requirement: Ficha de una propiedad
Cada propiedad visible SHALL tener una ficha en `/propiedades/<slug>` con todas sus fotos en el orden elegido (deslizables en el celular), título, operación y tipo, precio con su moneda, gastos comunes, dormitorios, baños, estacionamientos, bodegas, superficies, características, descripción con sus saltos de línea y ubicación. La dirección exacta SHALL mostrarse solo si la corredora lo permitió; si no, solo sector y comuna. Cada foto SHALL tener un texto alternativo con el título y su posición.

#### Scenario: Dirección oculta
- **WHEN** una propiedad tiene dirección pero no está permitido mostrarla
- **THEN** la ficha muestra sector y comuna y la dirección no aparece en la página

#### Scenario: Borrador o inexistente
- **WHEN** alguien abre la ficha de un borrador o de un slug que no existe
- **THEN** ve una página de "propiedad no encontrada" con acceso al listado, sin datos de ninguna propiedad

### Requirement: Contacto por WhatsApp
Si está configurado el número de WhatsApp de la corredora, el sitio SHALL ofrecer contactarla por WhatsApp. En la ficha de una propiedad disponible, el botón SHALL abrir WhatsApp con el mensaje "Hola, me interesa la propiedad <código> – <título>: <enlace a la ficha>" (sin el código si la propiedad no tiene). En una propiedad vendida o arrendada no SHALL haber botón destacado, solo una invitación discreta a consultar por propiedades similares. Si el número no está configurado, no SHALL mostrarse ningún botón de WhatsApp.

#### Scenario: Consulta por una propiedad disponible
- **WHEN** una persona toca "Consultar por WhatsApp" en la ficha de la propiedad GC-12 "Casa en Cavancha"
- **THEN** se abre WhatsApp con el mensaje "Hola, me interesa la propiedad GC-12 – Casa en Cavancha: " seguido del enlace a la ficha

#### Scenario: Propiedad vendida
- **WHEN** una persona abre la ficha de una propiedad vendida
- **THEN** ve la etiqueta "Vendida" y no ve el botón "Consultar por WhatsApp"

#### Scenario: Sin número configurado
- **WHEN** el sitio no tiene número de WhatsApp configurado
- **THEN** ninguna página muestra botones de WhatsApp

### Requirement: Páginas de contenido
El sitio SHALL tener las páginas Servicios, Nosotros y Contacto. Contacto SHALL mostrar las formas de contacto configuradas (WhatsApp, correo, Instagram) y la ciudad. Los textos institucionales SHALL estar en un único lugar para poder reemplazarlos sin tocar las páginas.

#### Scenario: Contacto con datos parciales
- **WHEN** están configurados WhatsApp e Instagram pero no el correo
- **THEN** la página de Contacto muestra WhatsApp e Instagram y no muestra ningún correo

### Requirement: El sitio refleja el panel
Lo que la corredora publica, edita o retira en el panel SHALL verse en el sitio público en la siguiente visita, y como máximo en 5 minutos aunque falle la invalidación inmediata.

#### Scenario: Publicar desde el panel
- **WHEN** la corredora cambia una propiedad de borrador a publicada en el panel
- **THEN** la siguiente visita al listado público la muestra

#### Scenario: Retirar desde el panel
- **WHEN** la corredora vuelve una propiedad publicada a borrador
- **THEN** la siguiente visita a su ficha muestra "propiedad no encontrada"

### Requirement: Imágenes adaptadas a la pantalla
Las fotos del sitio público SHALL servirse en un tamaño acorde al lugar donde se muestran y en un formato moderno cuando el navegador lo admita, sin cargar las que están fuera de pantalla hasta que se necesiten.

#### Scenario: Tarjeta del listado
- **WHEN** el listado muestra la portada de una propiedad en un celular
- **THEN** la imagen descargada es más chica que la foto original de 1600 px
