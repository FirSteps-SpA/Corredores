# property-map Specification

## Purpose
Define cómo la corredora indica dónde está cada propiedad y cómo el público ve esa ubicación en un mapa, protegiendo la ubicación exacta cuando la corredora no quiere mostrarla.

## Requirements

### Requirement: Marcar la ubicación en el panel
El formulario de la propiedad SHALL tener un mapa donde el admin marca la ubicación con un clic o arrastrando el marcador, un botón para ubicar la propiedad a partir de su dirección y comuna, y la opción de quitar la ubicación. La ubicación SHALL guardarse con el resto del formulario.

#### Scenario: Marcar con un clic
- **WHEN** el admin hace clic en el mapa sobre Cavancha y guarda
- **THEN** la propiedad queda con las coordenadas de ese punto

#### Scenario: Ubicar por dirección
- **WHEN** el admin escribe la dirección y la comuna y toca "Ubicar por dirección"
- **THEN** el marcador se mueve al punto encontrado y puede ajustarlo antes de guardar

#### Scenario: Dirección no encontrada
- **WHEN** la búsqueda de la dirección no encuentra resultados
- **THEN** el admin ve un aviso y el marcador no cambia

#### Scenario: Quitar la ubicación
- **WHEN** el admin quita la ubicación y guarda
- **THEN** la propiedad queda sin coordenadas

### Requirement: Coordenadas válidas
El sistema SHALL rechazar coordenadas fuera de rango o incompletas (solo latitud o solo longitud), con el error junto al mapa.

#### Scenario: Solo latitud
- **WHEN** llega al servidor una latitud sin longitud
- **THEN** el guardado se rechaza con un error de ubicación

### Requirement: Mapa en la ficha
La ficha de una propiedad con ubicación SHALL mostrar un mapa con atribución de OpenStreetMap. Si la dirección se puede mostrar, el mapa SHALL marcar el punto exacto. Si no, SHALL mostrar un círculo de unos 500 metros que contiene la ubicación real sin estar centrado en ella, con el aviso "Ubicación aproximada", y la página no SHALL contener las coordenadas exactas. Una propiedad sin ubicación no SHALL mostrar mapa.

#### Scenario: Ubicación exacta
- **WHEN** una persona abre la ficha de una propiedad con dirección visible y ubicación
- **THEN** ve el mapa con un marcador en la ubicación de la propiedad

#### Scenario: Ubicación aproximada
- **WHEN** una persona abre la ficha de una propiedad con dirección oculta y ubicación
- **THEN** ve un círculo con el aviso "Ubicación aproximada" y las coordenadas exactas no aparecen en la página

#### Scenario: Sin ubicación
- **WHEN** una persona abre la ficha de una propiedad sin coordenadas
- **THEN** no ve ningún mapa

### Requirement: Mapa liviano
El mapa SHALL cargarse solo cuando la sección de ubicación está por entrar en pantalla, sin retrasar la carga del resto de la ficha.

#### Scenario: Ficha abierta en el celular
- **WHEN** una persona abre una ficha y no baja hasta la ubicación
- **THEN** no se descargan las teselas del mapa
