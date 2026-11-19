# Spec Delta

## Purpose

Define cómo la corredora entra al panel privado con su cuenta, qué ve cualquier otra persona que intente entrar, y cómo cierra sesión o cambia su contraseña, para que el panel solo lo use quien está registrado como admin.

## ADDED Requirements

### Requirement: Inicio de sesión con correo y contraseña
El panel SHALL tener una pantalla de inicio de sesión con correo y contraseña. Un inicio de sesión correcto SHALL llevar al panel, o a la página del panel que se pidió antes de iniciar sesión. Un inicio de sesión fallido SHALL mostrar un mismo mensaje, sin indicar si el correo existe.

#### Scenario: Credenciales correctas
- **WHEN** la corredora ingresa su correo y contraseña en la pantalla de inicio de sesión
- **THEN** entra al panel

#### Scenario: Contraseña incorrecta o correo inexistente
- **WHEN** alguien ingresa una contraseña incorrecta, o un correo que no tiene cuenta
- **THEN** ve el mismo mensaje de error en ambos casos y sigue sin sesión

#### Scenario: Vuelta a la página pedida
- **WHEN** alguien sin sesión abre una página del panel, es enviado al inicio de sesión y entra correctamente
- **THEN** llega a la página del panel que había pedido

#### Scenario: Destino fuera del panel
- **WHEN** el enlace de inicio de sesión indica como destino una dirección fuera del panel o de otro sitio
- **THEN** tras entrar llega a la página principal del panel

#### Scenario: Ya tiene sesión
- **WHEN** el admin con sesión abre la pantalla de inicio de sesión
- **THEN** es llevado al panel

### Requirement: Panel cerrado a quien no es admin
Las páginas del panel SHALL mostrarse solo al admin. Sin sesión SHALL redirigir al inicio de sesión. Con la sesión de una cuenta que no es admin SHALL mostrar que la cuenta no tiene acceso, sin ningún dato del panel, y SHALL ofrecer cerrar sesión.

#### Scenario: Sin sesión
- **WHEN** alguien sin sesión abre una página del panel
- **THEN** es redirigido al inicio de sesión

#### Scenario: Cuenta que no es admin
- **WHEN** una cuenta autenticada que no está registrada como admin abre el panel
- **THEN** ve un aviso de que su cuenta no tiene acceso y la opción de cerrar sesión

#### Scenario: Admin
- **WHEN** el admin con sesión abre el panel
- **THEN** ve el panel con su correo y las opciones de cerrar sesión y cambiar contraseña

#### Scenario: Sesión vencida o inválida
- **WHEN** alguien abre el panel con una sesión vencida que no se puede renovar, o alterada
- **THEN** es tratado como sin sesión

### Requirement: Cerrar sesión
El panel SHALL permitir cerrar sesión. Después de cerrarla, volver a abrir el panel SHALL pedir iniciar sesión.

#### Scenario: Cierre de sesión
- **WHEN** el admin cierra sesión y luego abre el panel
- **THEN** es redirigido al inicio de sesión

### Requirement: Cambio de la propia contraseña
El admin SHALL poder cambiar su contraseña desde el panel ingresando la actual y dos veces la nueva. La contraseña nueva SHALL cumplir la política de contraseñas del proyecto; si la actual es incorrecta, la nueva no cumple o las dos no coinciden, el cambio SHALL rechazarse con un mensaje que explique por qué.

#### Scenario: Cambio correcto
- **WHEN** el admin ingresa su contraseña actual y dos veces una contraseña nueva válida
- **THEN** la contraseña cambia y la siguiente vez entra con la nueva

#### Scenario: Contraseña actual incorrecta
- **WHEN** el admin ingresa una contraseña actual incorrecta
- **THEN** el cambio se rechaza y la contraseña sigue siendo la anterior

#### Scenario: Contraseña débil
- **WHEN** el admin ingresa una contraseña nueva de 8 caracteres
- **THEN** el cambio se rechaza indicando el mínimo de 10 caracteres con letras y dígitos

#### Scenario: Confirmación distinta
- **WHEN** las dos contraseñas ingresadas no coinciden
- **THEN** el cambio se rechaza y la contraseña sigue siendo la anterior

### Requirement: Panel fuera de los buscadores
Las páginas del panel y del inicio de sesión SHALL pedir a los buscadores que no las indexen.

#### Scenario: Página de inicio de sesión
- **WHEN** un buscador descarga la pantalla de inicio de sesión
- **THEN** la página indica que no debe indexarse
