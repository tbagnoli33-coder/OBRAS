# Requirements Document

## Introduction

Esta feature rediseña la funcionalidad "CREAR PEDIDO" de la aplicación "Plataforma de Gestión - Hospitales" (archivo único `OBRAS v9.html`, JavaScript vanilla, sin frameworks ni dependencias externas). El objetivo es transformar el modal de creación actual (layout vertical de una sola línea de cargo, con GUARDAR que solo muestra un `alert` placeholder) en un formulario con detalle de RRHH en layout horizontal, soporte multi-línea de cargos, una regla de negocio que restringe los puestos según el escalafón elegido, y persistencia en memoria de la sesión que agrega el pedido al estado global `datosSheets`.

La cabecera del pedido (datos generales) permanece en formato vertical/apilado y es compartida por todas las líneas de cargo. Cada línea de RRHH es independiente en sus valores. La feature debe respetar la paleta de colores del contrato (#153244 principal, #8de2d6 secundario, #ffcc00 terciario), la fuente Montserrat, la accesibilidad mediante aria-labels, y no romper la funcionalidad existente (chips de estado, búsqueda avanzada, navegación de hospitales, cierre del modal al hacer clic afuera).

No existe backend aún: la persistencia es únicamente en memoria de la sesión y se pierde al recargar la página. Este documento cubre exclusivamente los requisitos (requirements). El diseño (design.md) y las tareas (tasks.md) se generarán posteriormente.

## Glossary

- **Sistema**: La aplicación "Plataforma de Gestión - Hospitales" contenida en el archivo único `OBRAS v9.html`.
- **Modal_Creacion**: El modal identificado como `#modal-creacion`, abierto por la función `abrirModalCreacion()`, donde el usuario crea un pedido.
- **Cabecera_Pedido**: Sección superior del modal con los datos generales compartidos por todas las líneas: Hospital, Tipo de Pedido, Denominación/Detalle, Fecha de Fin, y checkbox Despriorizado.
- **Detalle_RRHH**: Sección del modal que contiene una o más líneas de cargo asociadas al pedido.
- **Linea_RRHH**: Una fila del Detalle_RRHH que representa un cargo, con sus propios valores: Tipo de Q, Escalafón, Puesto Nuevo, Q Planificado, Q Pedido, Q Aprobado, Canal de Solicitud y Expediente.
- **Selector_Cantidad**: Control numérico ubicado junto al botón "AGREGAR LÍNEA DE PEDIDO" que permite valores enteros de 1 a 10.
- **Boton_Agregar_Linea**: Botón con borde punteado etiquetado "AGREGAR LÍNEA DE PEDIDO".
- **Mapa_Escalafon_Puesto**: Estructura de datos que asocia cada escalafón a una lista de puestos válidos, cargada desde un CSV de validación.
- **Puesto_Nuevo**: Campo de una Linea_RRHH que indica el puesto solicitado; puede presentarse como selector de opciones o como texto libre según el escalafón.
- **datosSheets**: Objeto global del estado de la aplicación con estructura `{ "NombreEfector": [ pedidos ] }`, donde cada pedido es `{ tipo, detalle, fecha, prioridad, cargos: [ ... ] }`.
- **Efector**: Hospital/establecimiento bajo el cual se agrupan los pedidos en `datosSheets`.
- **Catalogos**: Objeto global `catalogos` con `tiposPedido`, `tiposQ` (POU, POF, LOYS, ESTRUCTURA) y `escalafones`.
- **Campos_Obligatorios**: Conjunto mínimo de campos requeridos para guardar: Hospital, Tipo de Pedido y Denominación/Detalle en la Cabecera_Pedido, y Escalafón y Puesto Nuevo en cada Linea_RRHH.
- **Boton_Guardar**: Botón GUARDAR del Modal_Creacion, manejado por la función `guardarNuevoPedido()`.
- **Vista_Compacta**: Estado de presentación aplicado cuando el ancho de la ventana es menor o igual a 768px.

## Requirements

### Requirement 1: Layout de la cabecera del pedido

**User Story:** Como usuario que crea un pedido, quiero que los datos generales del pedido se muestren agrupados arriba en formato vertical, para completar una sola vez la información común a todas las líneas.

#### Acceptance Criteria

1. WHEN el usuario abre el Modal_Creacion, THE Sistema SHALL mostrar la Cabecera_Pedido en formato vertical apilado con los campos Hospital, Tipo de Pedido, Denominación/Detalle, Fecha de Fin y checkbox Despriorizado.
2. THE Sistema SHALL poblar el campo Hospital con los efectores disponibles como opciones seleccionables.
3. THE Sistema SHALL poblar el campo Tipo de Pedido con los valores de `catalogos.tiposPedido` como opciones seleccionables.
4. THE Sistema SHALL presentar el campo Denominación/Detalle como entrada de texto libre.
5. THE Sistema SHALL presentar el campo Fecha de Fin como entrada de fecha.
6. THE Sistema SHALL presentar el control Despriorizado como checkbox con estado inicial no marcado.
7. THE Cabecera_Pedido SHALL ser compartida por todas las líneas de Detalle_RRHH del pedido.

### Requirement 2: Layout horizontal del detalle de RRHH

**User Story:** Como usuario que crea un pedido, quiero que cada línea de cargo se muestre en formato horizontal, para visualizar y completar los campos de un cargo en una sola fila.

#### Acceptance Criteria

1. WHEN el Modal_Creacion se muestra, THE Sistema SHALL presentar la sección Detalle_RRHH debajo de la Cabecera_Pedido.
2. THE Sistema SHALL mostrar cada Linea_RRHH como una fila con los campos en orden horizontal: Tipo de Q, Escalafón, Puesto Nuevo, Q Planificado, Q Pedido, Q Aprobado.
3. THE Sistema SHALL mostrar, debajo de la fila principal de cada Linea_RRHH, un renglón secundario con los campos Canal de Solicitud y Expediente.
4. THE Sistema SHALL presentar el campo Tipo de Q como selector con los valores de `catalogos.tiposQ`.
5. THE Sistema SHALL presentar el campo Escalafón como selector con los valores de `catalogos.escalafones`.
6. THE Sistema SHALL presentar el campo Expediente como entrada de texto libre.
7. THE Sistema SHALL aplicar la clase `.input-creacion` a los selectores de la Linea_RRHH, manteniendo la coherencia con los estilos existentes.

### Requirement 3: Diseño responsive del detalle de RRHH

**User Story:** Como usuario en una pantalla chica, quiero que las filas horizontales se reorganicen, para completar el formulario sin desbordes ni scroll horizontal.

#### Acceptance Criteria

1. WHILE el ancho de la ventana es menor o igual a 768px, THE Sistema SHALL reorganizar los campos de cada Linea_RRHH para que no desborden el ancho disponible.
2. WHILE el ancho de la ventana es mayor a 768px, THE Sistema SHALL mostrar los campos principales de la Linea_RRHH en disposición horizontal en una fila.

### Requirement 4: Agregar múltiples líneas de pedido

**User Story:** Como usuario que crea un pedido con varios cargos, quiero agregar varias líneas de RRHH de una sola vez indicando una cantidad, para no repetir la acción manualmente.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar el Boton_Agregar_Linea con borde punteado y la etiqueta "AGREGAR LÍNEA DE PEDIDO" debajo del Detalle_RRHH.
2. THE Sistema SHALL mostrar el Selector_Cantidad junto al Boton_Agregar_Linea, con valores enteros seleccionables de 1 a 10.
3. THE Selector_Cantidad SHALL aceptar como máximo el valor 10.
4. WHEN el usuario hace clic en el Boton_Agregar_Linea, THE Sistema SHALL agregar al Detalle_RRHH tantas líneas de RRHH nuevas como indique el valor del Selector_Cantidad.
5. WHEN el Sistema agrega una nueva Linea_RRHH, THE Sistema SHALL inicializar los campos numéricos Q Planificado, Q Pedido y Q Aprobado en 0.
6. WHEN el Sistema agrega una nueva Linea_RRHH, THE Sistema SHALL inicializar los campos de texto de esa línea vacíos.
7. THE Sistema SHALL mantener los valores de cada Linea_RRHH de forma independiente respecto de las demás líneas.

### Requirement 5: Eliminar líneas de pedido

**User Story:** Como usuario que crea un pedido, quiero eliminar una línea de RRHH específica, para corregir el detalle sin rehacer todo el formulario.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar en cada Linea_RRHH un control de eliminación individual.
2. WHEN el usuario activa el control de eliminación de una Linea_RRHH, THE Sistema SHALL eliminar esa línea del Detalle_RRHH.
3. IF la acción de eliminación dejaría el Detalle_RRHH sin líneas, THEN THE Sistema SHALL conservar al menos una Linea_RRHH.
4. THE Detalle_RRHH SHALL contener siempre al menos una Linea_RRHH.

### Requirement 6: Restricción de puesto según escalafón

**User Story:** Como usuario que crea un pedido, quiero que el campo Puesto Nuevo se limite a los puestos válidos del escalafón elegido en esa línea, para evitar combinaciones inválidas.

#### Acceptance Criteria

1. THE Sistema SHALL disponer del Mapa_Escalafon_Puesto que asocia cada escalafón a su lista de puestos válidos, cargado desde el CSV de validación.
2. WHEN el usuario selecciona un escalafón con puestos definidos en el Mapa_Escalafon_Puesto en una Linea_RRHH, THE Sistema SHALL presentar el campo Puesto Nuevo de esa línea como selector limitado únicamente a los puestos válidos de ese escalafón.
3. WHEN el usuario selecciona un escalafón sin puestos definidos en el Mapa_Escalafon_Puesto en una Linea_RRHH, THE Sistema SHALL presentar el campo Puesto Nuevo de esa línea como entrada de texto libre.
4. WHEN el usuario cambia el escalafón de una Linea_RRHH y el puesto previamente seleccionado no pertenece a los puestos válidos del nuevo escalafón, THE Sistema SHALL limpiar el valor del campo Puesto Nuevo de esa línea.
5. THE Sistema SHALL aplicar la restricción de puesto de forma independiente por cada Linea_RRHH, según el escalafón propio de cada línea.
6. THE Mapa_Escalafon_Puesto SHALL definir la cantidad de puestos válidos por escalafón como: ENFERMERIA con 2, CETPS con 28, CPH MEDICO GUARDIA con 85, CPH NO MEDICO GUARDIA con 48, CPH MEDICO PLANTA con 85, CPH NO MEDICO PLANTA con 48, ESCALAFON GRAL. con 95, y SERVICIOS GRALES. ANEXO II con 7.
7. THE Mapa_Escalafon_Puesto SHALL definir con lista vacía de puestos los escalafones: LOYS, PLANTA DE GABINETE, GERENTE OPERATIVO, SUBGERENTE OPERATIVO, JEFE DE DEPARTAMENTO, JEFE DE DIVISION, JEFE DE SECCION y JEFE DE UNIDAD.

### Requirement 7: Validación de campos obligatorios al guardar

**User Story:** Como usuario que crea un pedido, quiero que el sistema me avise si faltan datos obligatorios antes de guardar, para no registrar pedidos incompletos.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el Boton_Guardar, THE Sistema SHALL validar que la Cabecera_Pedido tenga completos los campos Hospital, Tipo de Pedido y Denominación/Detalle.
2. WHEN el usuario hace clic en el Boton_Guardar, THE Sistema SHALL validar que cada Linea_RRHH tenga completos los campos Escalafón y Puesto Nuevo.
3. IF alguno de los Campos_Obligatorios está incompleto al hacer clic en el Boton_Guardar, THEN THE Sistema SHALL avisar al usuario cuáles campos faltan y cancelar el guardado.

### Requirement 8: Persistencia del pedido en memoria

**User Story:** Como usuario que crea un pedido, quiero que al guardar el pedido quede registrado y visible en la app, para continuar la gestión del pedido durante la sesión.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el Boton_Guardar y todos los Campos_Obligatorios están completos, THE Sistema SHALL agregar el pedido a `datosSheets` bajo el efector correspondiente al Hospital seleccionado.
2. WHEN el Sistema agrega el pedido a `datosSheets`, THE Sistema SHALL incluir en el pedido los campos `tipo`, `detalle`, `fecha`, `prioridad` y `cargos` con todas las líneas de Detalle_RRHH.
3. WHEN el Sistema agrega una Linea_RRHH al arreglo `cargos` del pedido, THE Sistema SHALL registrar los campos `tipoQ`, `escalafon`, `puesto`, `qPlan`, `canal`, `qPedido`, `expediente`, `qAprobado`, `validado` y `resuelto`.
4. WHEN el checkbox Despriorizado está marcado al guardar, THE Sistema SHALL reflejar ese estado en el campo `prioridad` del pedido.
5. WHEN el Sistema guarda el pedido correctamente, THE Sistema SHALL mostrar el nuevo pedido al ingresar al Hospital correspondiente.
6. WHEN el Sistema guarda el pedido correctamente, THE Sistema SHALL cerrar el Modal_Creacion.
7. THE Sistema SHALL persistir el pedido únicamente en memoria de la sesión, sin backend.

### Requirement 9: Restricción conocida de persistencia y punto de integración

**User Story:** Como responsable del producto, quiero que quede documentada la naturaleza temporal de la persistencia y previsto el punto de integración con backend, para planificar la evolución futura.

#### Acceptance Criteria

1. IF la página se recarga, THEN THE Sistema SHALL perder los pedidos creados durante la sesión, por no existir backend.
2. THE Sistema SHALL dejar previsto un punto de integración con backend para persistir los pedidos a futuro.

### Requirement 10: Compatibilidad con la funcionalidad existente

**User Story:** Como usuario de la plataforma, quiero que el rediseño no rompa las funciones que ya uso, para seguir trabajando sin interrupciones.

#### Acceptance Criteria

1. WHEN el usuario hace clic fuera del Modal_Creacion, THE Sistema SHALL cerrar el modal usando la lógica de cierre existente.
2. THE Sistema SHALL mantener operativas las funcionalidades existentes de chips de estado, búsqueda avanzada y navegación de hospitales.
3. WHEN el Sistema agrega un pedido a `datosSheets`, THE Sistema SHALL mantener la estructura de datos compatible con las funcionalidades existentes que consumen `datosSheets`.

### Requirement 11: Restricciones técnicas y de presentación

**User Story:** Como mantenedor del proyecto, quiero que la implementación respete las restricciones técnicas y de estilo del proyecto, para preservar la coherencia y simplicidad de la aplicación.

#### Acceptance Criteria

1. THE Sistema SHALL implementar la feature dentro del archivo único `OBRAS v9.html` usando JavaScript vanilla, sin dependencias externas.
2. THE Sistema SHALL usar la paleta de colores del contrato: #153244 como color principal, #8de2d6 como secundario y #ffcc00 como terciario.
3. THE Sistema SHALL usar la fuente Montserrat en los elementos de la feature.

### Requirement 12: Accesibilidad de los controles nuevos

**User Story:** Como usuario que utiliza tecnologías de asistencia, quiero que los controles nuevos tengan etiquetas accesibles, para operar el formulario con lector de pantalla.

#### Acceptance Criteria

1. THE Sistema SHALL asignar un aria-label al Boton_Agregar_Linea.
2. THE Sistema SHALL asignar un aria-label al Selector_Cantidad.
3. THE Sistema SHALL asignar un aria-label al control de eliminación de cada Linea_RRHH.
4. THE Sistema SHALL asignar aria-labels a los campos de entrada y selectores de cada Linea_RRHH.
