# Spec Delta

## ADDED Requirements

### Requirement: Ubicación exacta protegida
La dirección y las coordenadas exactas de una propiedad que no permite mostrar la dirección SHALL no ser legibles con la clave pública sin sesión, ni siquiera llamando directamente a la API: el público SHALL obtener esa propiedad sin dirección y con una ubicación aproximada. Las cuentas con sesión solo existen si el equipo las crea (registro cerrado) y el admin SHALL leer los datos exactos.

#### Scenario: Lectura directa por la API
- **WHEN** alguien sin sesión pide a la API la dirección y las coordenadas de una propiedad publicada con la dirección oculta
- **THEN** no obtiene la dirección ni las coordenadas exactas

#### Scenario: Dirección permitida
- **WHEN** la propiedad permite mostrar la dirección
- **THEN** el público obtiene su dirección y coordenadas exactas

#### Scenario: Admin
- **WHEN** el admin lee la propiedad
- **THEN** obtiene la dirección y las coordenadas exactas
