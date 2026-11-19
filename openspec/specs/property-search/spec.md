# property-search Specification

## Purpose
Define cómo el público encuentra propiedades en el sitio: filtrar por lo que busca, comparar precios aunque estén en UF o en pesos, ordenar, recorrer los resultados por páginas y compartir una búsqueda con un enlace.

## Requirements

### Requirement: Filtros del listado
El listado SHALL poder filtrarse por operación, tipo, comuna, sector, precio mínimo y máximo, dormitorios mínimos, baños mínimos y "ocultar vendidas y arrendadas", combinables entre sí. Los filtros SHALL quedar en la URL, de modo que abrir esa URL muestre los mismos resultados, y SHALL funcionar sin JavaScript. Las opciones de comuna y sector SHALL ser solo las que tienen propiedades visibles.

#### Scenario: Arriendo de departamentos en una comuna
- **WHEN** una persona filtra arriendo, tipo departamento y comuna Iquique
- **THEN** ve solo departamentos en arriendo en Iquique, y la URL contiene esos filtros

#### Scenario: Enlace compartido
- **WHEN** alguien abre un enlace del listado con filtros de otra persona
- **THEN** ve los mismos resultados y el formulario con esos filtros marcados

#### Scenario: Dormitorios mínimos
- **WHEN** una persona filtra "3 o más" dormitorios
- **THEN** no ve propiedades con menos de 3 dormitorios ni sin dormitorios indicados

#### Scenario: Sin resultados
- **WHEN** ninguna propiedad cumple los filtros
- **THEN** ve un aviso de que no hay resultados y un acceso para limpiar los filtros

#### Scenario: Valores inválidos en la URL
- **WHEN** la URL trae un filtro con un valor desconocido o no numérico
- **THEN** ese filtro se ignora y el resto se aplica

### Requirement: Precio comparable entre UF y pesos
El rango de precio SHALL expresarse en UF o en pesos. Una propiedad en la otra moneda SHALL compararse convertida con el valor de la UF del día. Si no hay valor de UF disponible, el rango SHALL comparar solo propiedades en la misma moneda del rango. El precio mostrado de cada propiedad no SHALL cambiar por la conversión.

#### Scenario: Venta en pesos dentro de un rango en UF
- **WHEN** la UF vale $40.000, una propiedad cuesta $160.000.000 y la persona filtra entre UF 3.000 y UF 5.000
- **THEN** la propiedad aparece (equivale a UF 4.000) y se sigue mostrando como $160.000.000

#### Scenario: Sin valor de UF
- **WHEN** no hay valor de UF disponible y la persona filtra hasta UF 5.000
- **THEN** solo ve propiedades publicadas en UF que cumplen el rango

### Requirement: Orden de los resultados
Los resultados SHALL poder ordenarse por relevancia (orden por defecto del listado), precio de menor a mayor, precio de mayor a menor y más recientes. El orden por precio SHALL comparar UF y pesos con la misma conversión del filtro. En todos los órdenes, las vendidas y arrendadas SHALL ir al final.

#### Scenario: Precio de menor a mayor
- **WHEN** una persona ordena por precio de menor a mayor
- **THEN** las propiedades disponibles aparecen de la más barata a la más cara, y después las vendidas y arrendadas

### Requirement: Paginación
El listado SHALL mostrar 12 propiedades por página, la cantidad total de resultados y enlaces a las demás páginas que conservan filtros y orden.

#### Scenario: Segunda página
- **WHEN** hay 14 resultados y la persona pasa a la página 2
- **THEN** ve las 2 últimas propiedades y los filtros siguen aplicados

#### Scenario: Página fuera de rango
- **WHEN** la URL pide una página mayor que la última
- **THEN** ve la última página

### Requirement: Buscador del inicio
El inicio SHALL tener un buscador con tipo de propiedad, comuna y rango de precio (rangos separados para venta en UF y arriendo en pesos) que lleve al listado con esos filtros aplicados, también sin JavaScript.

#### Scenario: Búsqueda desde el inicio
- **WHEN** una persona elige "Departamento", "Iquique" y "Arriendo: $400.000 – $700.000" y toca Buscar
- **THEN** llega al listado con arriendos de departamentos en Iquique de entre $400.000 y $700.000
