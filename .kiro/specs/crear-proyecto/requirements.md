# Requirements Document

## Introduction

Este documento especifica los requisitos del nuevo módulo **CREAR PROYECTO** dentro de la SPA existente (`OBRAS v9.html`). Un **Proyecto** es lo que hasta ahora se conocía como "vista global" o "etiqueta" (ejemplos: "200 CARGOS", "RECORRIDA FQ"): un agrupamiento con nombre que abarca pedidos de obra de uno o más hospitales. Hoy los Proyectos no existen como entidad de primera clase; se materializan como pedidos de obra cuya denominación (campo `detalle`) coincide con el nombre del Proyecto, y la barra de etiquetas los detecta por coincidencia de texto.

El módulo agrega un flujo de creación análogo al de CREAR PEDIDO: un botón "+ CREAR PROYECTO" abre un modal donde el usuario nombra el Proyecto, asigna uno o más hospitales (sin tope) y, por cada hospital asignado, carga en miniatura las líneas de RRHH del pedido de obra correspondiente a ese hospital dentro del marco del Proyecto. Al guardar, cada hospital asignado recibe un pedido de obra cuya denominación es el nombre del Proyecto, de modo que el Proyecto aparece automáticamente como vista global/etiqueta y su filtrado muestra los pedidos de todos los hospitales asignados.

El desarrollo se realiza íntegramente dentro de `OBRAS v9.html` (JavaScript vanilla inline, sin librerías, sin proceso de build, sin archivos nuevos), respetando `contrato.md` (paleta fija: principal #153244, secundario #8de2d6, terciario #ffcc00; tipografía Montserrat; contenedores adaptables al contenido salvo excepciones acordadas). La persistencia es solo en memoria (sesión) sobre el objeto `datosSheets`; el backend es un punto de integración futuro.

## Glossary

- **App**: La aplicación web de una sola página contenida en `OBRAS v9.html`.
- **Proyecto**: Agrupamiento con nombre que abarca pedidos de obra de uno o más hospitales. Equivale a una vista global/etiqueta existente.
- **Modulo_Crear_Proyecto**: El conjunto de interfaz y lógica que permite crear un Proyecto. Comprende el botón de apertura, el modal y su lógica de validación y guardado.
- **Modal_Crear_Proyecto**: La ventana emergente donde el usuario nombra el Proyecto, asigna hospitales y carga las líneas de RRHH por hospital.
- **Hospital_Asignado**: Un hospital que el usuario ha incorporado al Proyecto dentro del Modal_Crear_Proyecto.
- **Bloque_Hospital**: La sección de interfaz, dentro del Modal_Crear_Proyecto, correspondiente a un Hospital_Asignado; contiene sus líneas de RRHH y su control para agregar líneas, de forma independiente de los demás hospitales.
- **Linea_RRHH**: Una fila de detalle de recursos humanos con los campos: Tipo de Q, Escalafón, Puesto Nuevo, Q Plan, Q Pedido y Q Aprobado.
- **Cargo**: El objeto de datos que representa una Linea_RRHH persistida: `{ tipoQ, escalafon, puesto, qPlan, canal, qPedido, expediente, qAprobado, validado, resuelto }`.
- **Pedido**: Un pedido de obra persistido: `{ tipo, detalle, fecha, prioridad, cargos }`, donde `cargos` es una lista de Cargo.
- **datosSheets**: El objeto en memoria que mapea nombre de hospital a lista de Pedido: `{ [hospital]: Pedido[] }`. Es la única fuente de datos que lee la interfaz.
- **Mapa_Escalafon_Puesto**: La estructura `MAPA_ESCALAFON_PUESTO`, con 16 escalafones; 8 con lista de puestos válidos (Puesto Nuevo se presenta como selector filtrado) y 8 con lista vacía (Puesto Nuevo se presenta como texto libre).
- **Vista_Global**: El modo de visualización que filtra y muestra pedidos de todos los hospitales cuya denominación contiene un patrón (etiqueta activa).
- **Barra_Etiquetas**: La interfaz que lista los Proyectos detectados (`#barra-etiquetas-principal` en el inicio y `#barra-etiquetas` dentro de un hospital).

## Requirements

### Requirement 1: Acceso al módulo CREAR PROYECTO

**User Story:** Como usuario del sistema de obras, quiero un acceso claro para crear un Proyecto, para poder iniciar el flujo de creación de una vista global agrupadora.

#### Acceptance Criteria

1. THE App SHALL mostrar un control de acción rotulado "+ CREAR PROYECTO" ubicado como control flotante (mismo patrón que el botón "+ CREAR PEDIDO", clase btn-crear-flotante).
2. WHEN el usuario activa el control "+ CREAR PROYECTO", THE Modulo_Crear_Proyecto SHALL abrir el Modal_Crear_Proyecto en 1 segundo o menos, aplicando el estado visible del overlay (clase 'abierto').
3. WHEN el Modal_Crear_Proyecto se abre, THE Modulo_Crear_Proyecto SHALL inicializarlo con el campo Nombre del Proyecto vacío, sin ningún Bloque_Hospital y sin líneas de RRHH residuales de aperturas anteriores.
4. THE control "+ CREAR PROYECTO" SHALL usar la paleta fija de `contrato.md` (principal #153244, secundario #8de2d6, terciario #ffcc00) y la tipografía Montserrat.
5. THE control "+ CREAR PROYECTO" SHALL exponer un aria-label que describa su acción de abrir el flujo de creación de Proyecto.
6. WHEN el usuario activa el área externa al contenido del Modal_Crear_Proyecto (overlay), THE Modulo_Crear_Proyecto SHALL cerrar el modal.

### Requirement 2: Nombrar el Proyecto

**User Story:** Como usuario, quiero nombrar el Proyecto al inicio del flujo, para identificar el agrupamiento que voy a crear.

#### Acceptance Criteria

1. THE Modal_Crear_Proyecto SHALL presentar un campo de entrada de texto para el Nombre del Proyecto con etiqueta visible y aria-label.
2. WHEN el usuario ingresa el Nombre del Proyecto, THE Modulo_Crear_Proyecto SHALL conservar el valor ingresado durante la sesión del modal.
3. THE Modulo_Crear_Proyecto SHALL aplicar trim (recorte de espacios al inicio y fin) al Nombre del Proyecto antes de validarlo y antes de usarlo como campo `detalle` de los Pedidos.
4. IF el Nombre del Proyecto queda vacío tras el trim al intentar guardar, THEN THE Modulo_Crear_Proyecto SHALL impedir el guardado e informar que el Nombre del Proyecto es obligatorio.

### Requirement 3: Asignar hospitales al Proyecto

**User Story:** Como usuario, quiero asignar uno o más hospitales al Proyecto sin límite de cantidad, para abarcar todos los efectores que participan del Proyecto.

#### Acceptance Criteria

1. THE Modal_Crear_Proyecto SHALL ofrecer un mecanismo para seleccionar y asignar un hospital al Proyecto a partir de los hospitales navegables (claves de `datosSheets` filtradas por `esEfectorNavegable`, excluyendo `EFECTORES_OCULTOS` como "200 CARGOS").
2. WHEN el usuario confirma la asignación de un hospital, THE Modulo_Crear_Proyecto SHALL crear un Bloque_Hospital para ese Hospital_Asignado como último elemento del listado de hospitales asignados, en 1 segundo o menos.
3. THE Modulo_Crear_Proyecto SHALL permitir asignar hospitales hasta agotar los hospitales navegables disponibles y no asignados, sin imponer un tope numérico propio.
4. IF el usuario intenta asignar un hospital que ya está asignado, THEN THE Modulo_Crear_Proyecto SHALL rechazar la asignación duplicada, preservar el estado del Bloque_Hospital existente e informar al usuario que el hospital ya está asignado.
5. WHEN el usuario quita un Hospital_Asignado, THE Modulo_Crear_Proyecto SHALL eliminar su Bloque_Hospital y todas sus líneas de RRHH, preservando los demás Bloque_Hospital sin cambios.
6. WHILE el Modal_Crear_Proyecto está abierto, THE Modulo_Crear_Proyecto SHALL mantener las líneas de RRHH de cada Bloque_Hospital independientes, de modo que agregar, modificar o eliminar una línea en un bloque no altere las líneas de otros bloques.
7. IF el usuario intenta confirmar la asignación sin haber seleccionado un hospital, THEN THE Modulo_Crear_Proyecto SHALL no crear ningún Bloque_Hospital e informar que debe seleccionar un hospital.

### Requirement 4: Cargar líneas de RRHH por hospital (pedido en miniatura)

**User Story:** Como usuario, quiero cargar las líneas de RRHH del pedido de obra de cada hospital dentro del Proyecto, con la misma lógica que el modal CREAR PEDIDO, para detallar los cargos de cada efector.

#### Acceptance Criteria

1. THE Bloque_Hospital SHALL presentar por cada Linea_RRHH los campos Tipo de Q, Escalafón, Puesto Nuevo, Q Plan, Q Pedido y Q Aprobado.
2. WHEN se crea un Bloque_Hospital, THE Modulo_Crear_Proyecto SHALL inicializarlo con exactamente una Linea_RRHH.
3. THE Bloque_Hospital SHALL poblar el selector Tipo de Q con los valores de `catalogos.tiposQ`.
4. THE Bloque_Hospital SHALL poblar el selector Escalafón con las 16 categorías definidas en el Mapa_Escalafon_Puesto.
5. WHEN el usuario selecciona un valor de Escalafón en una Linea_RRHH, THE Modulo_Crear_Proyecto SHALL poblar el selector Puesto Nuevo de esa misma Linea_RRHH únicamente con los puestos asociados a ese Escalafón según el Mapa_Escalafon_Puesto.
6. THE Bloque_Hospital SHALL ofrecer un control rotulado "AGREGAR LÍNEA DE PEDIDO" y un selector numérico de cantidad de líneas acotado al rango 1 a 10 inclusive.
7. WHEN el usuario activa "AGREGAR LÍNEA DE PEDIDO" con una cantidad seleccionada, THE Modulo_Crear_Proyecto SHALL agregar al Bloque_Hospital esa cantidad de Linea_RRHH, acotando previamente la cantidad al rango 1 a 10 inclusive.
8. WHEN el usuario elimina una Linea_RRHH de un Bloque_Hospital que contiene 2 o más Linea_RRHH, THE Modulo_Crear_Proyecto SHALL remover únicamente la Linea_RRHH indicada dentro de ese Bloque_Hospital.
9. IF el usuario intenta eliminar una Linea_RRHH cuando el Bloque_Hospital contiene una única Linea_RRHH, THEN THE Modulo_Crear_Proyecto SHALL conservar esa Linea_RRHH e informar que debe existir al menos una Linea_RRHH por Bloque_Hospital.
10. WHEN el Modulo_Crear_Proyecto crea o agrega una Linea_RRHH, THE Modulo_Crear_Proyecto SHALL asignar a los campos de esa línea identificadores únicos con alcance por Bloque_Hospital, de modo que las líneas de distintos Bloque_Hospital no compartan identificadores.
11. THE Modulo_Crear_Proyecto SHALL exponer aria-label en cada campo de cada Linea_RRHH.

### Requirement 5: Regla Escalafón → Puesto Nuevo

**User Story:** Como usuario, quiero que el campo Puesto Nuevo se ajuste al Escalafón elegido, para cargar puestos válidos y mantener consistencia con CREAR PEDIDO.

#### Acceptance Criteria

1. WHEN el usuario selecciona un Escalafón con puestos definidos en el Mapa_Escalafon_Puesto, THE Modulo_Crear_Proyecto SHALL presentar el campo Puesto Nuevo como un selector cuyas opciones son exactamente los puestos válidos de ese Escalafón, sin incluir puestos de otros escalafones.
2. WHEN el usuario selecciona un Escalafón cuya lista de puestos está vacía en el Mapa_Escalafon_Puesto, THE Modulo_Crear_Proyecto SHALL presentar el campo Puesto Nuevo como un campo de texto libre.
3. WHEN el usuario cambia el Escalafón de una Linea_RRHH, THE Modulo_Crear_Proyecto SHALL reconstruir el campo Puesto Nuevo de esa misma Linea_RRHH según la regla del Mapa_Escalafon_Puesto y restablecer su valor previo a vacío.
4. THE Modulo_Crear_Proyecto SHALL usar el mismo Mapa_Escalafon_Puesto que el módulo CREAR PEDIDO para determinar la presentación del campo Puesto Nuevo.

### Requirement 6: Validaciones al guardar el Proyecto

**User Story:** Como usuario, quiero que el sistema valide los datos mínimos antes de guardar, para evitar crear Proyectos incompletos.

#### Acceptance Criteria

1. IF el Nombre del Proyecto está vacío o contiene únicamente espacios al intentar guardar, THEN THE Modulo_Crear_Proyecto SHALL impedir el guardado, agregar "Nombre del Proyecto" a la lista de campos faltantes y dejar `datosSheets` sin modificar.
2. IF el Proyecto no tiene ningún Hospital_Asignado al intentar guardar, THEN THE Modulo_Crear_Proyecto SHALL impedir el guardado, agregar "al menos un hospital asignado" a la lista de campos faltantes y dejar `datosSheets` sin modificar.
3. IF algún Hospital_Asignado no tiene al menos una Linea_RRHH con Escalafón y Puesto Nuevo ambos no vacíos al intentar guardar, THEN THE Modulo_Crear_Proyecto SHALL impedir el guardado, agregar a la lista de faltantes cada campo vacío identificando el nombre del hospital y el número de línea visual (1-based) dentro del bloque, y dejar `datosSheets` sin modificar.
4. WHEN el intento de guardado finaliza con uno o más campos faltantes, THE Modulo_Crear_Proyecto SHALL presentar un único mensaje con la lista completa de campos faltantes en el orden en que fueron detectados.
5. WHEN el intento de guardado finaliza sin campos faltantes, THE Modulo_Crear_Proyecto SHALL permitir el guardado del Proyecto.

### Requirement 7: Persistencia del Proyecto en memoria

**User Story:** Como usuario, quiero que al guardar el Proyecto se registren los pedidos de cada hospital en la sesión, para que el Proyecto quede reflejado en los datos existentes.

#### Acceptance Criteria

1. WHEN el usuario guarda un Proyecto cuyo Nombre no está vacío y que tiene al menos un Hospital_Asignado, THE Modulo_Crear_Proyecto SHALL crear, por cada Hospital_Asignado, un Pedido en `datosSheets` bajo la clave de ese hospital.
2. THE Modulo_Crear_Proyecto SHALL asignar al campo `detalle` de cada Pedido creado el Nombre del Proyecto.
3. THE Modulo_Crear_Proyecto SHALL construir el arreglo `cargos` de cada Pedido a partir de las líneas de RRHH del Bloque_Hospital correspondiente, incluyendo en cada Cargo los campos `tipoQ`, `escalafon`, `puesto`, `qPlan`, `canal`, `qPedido`, `expediente`, `qAprobado`, `validado` en `false` y `resuelto` en `false`.
4. WHEN el Bloque_Hospital no contiene líneas de RRHH, THE Modulo_Crear_Proyecto SHALL asignar al campo `cargos` del Pedido un arreglo vacío.
5. THE Modulo_Crear_Proyecto SHALL inicializar el campo `prioridad` de cada Pedido creado con el valor "-".
6. THE Modulo_Crear_Proyecto SHALL inicializar el campo `tipo` de cada Pedido creado con el valor "Proyecto".
7. THE Modulo_Crear_Proyecto SHALL inicializar el campo `fecha` de cada Pedido creado con la cadena vacía "".
8. THE Modulo_Crear_Proyecto SHALL registrar la persistencia de cada Pedido invocando `persistirPedidoBackend(hospital, pedido)`, que en esta fase opera solo en memoria y sin efectos fuera de la sesión.
9. WHEN un Hospital_Asignado no tiene aún entrada en `datosSheets`, THE Modulo_Crear_Proyecto SHALL crear la entrada correspondiente antes de agregar su Pedido.
10. IF el Proyecto tiene Nombre vacío o no tiene ningún Hospital_Asignado, THEN THE Modulo_Crear_Proyecto SHALL rechazar el guardado sin crear ni modificar ningún Pedido en `datosSheets`, e informar el motivo del rechazo.

### Requirement 8: Visibilidad del Proyecto como vista global

**User Story:** Como usuario, quiero que el Proyecto guardado aparezca como vista global y que al filtrarlo vea los pedidos de todos sus hospitales, para consultar el Proyecto de forma unificada.

#### Acceptance Criteria

1. WHEN un Proyecto guardado alcanza el umbral de detección de etiquetas existente (conteo de pedidos cuya denominación contiene el Nombre del Proyecto mayor o igual a `UMBRAL_ETIQUETA`, o figura en `ETIQUETAS_CURADAS`), THE App SHALL mostrar el Proyecto en la Barra_Etiquetas.
2. WHEN el usuario activa el Proyecto desde la Barra_Etiquetas, THE App SHALL mostrar en la Vista_Global los pedidos de todos los hospitales cuya denominación contiene el Nombre del Proyecto.
3. WHEN el usuario guarda un Proyecto, THE App SHALL refrescar la interfaz (barra de etiquetas y navegación) de modo que los pedidos recién creados queden disponibles para navegación y filtrado sin recargar la página.
4. IF el Proyecto guardado no alcanza el umbral de detección ni figura entre las etiquetas curadas, THEN THE App SHALL mantener los Pedidos accesibles vía navegación de hospitales aunque el Proyecto no aparezca en la Barra_Etiquetas.

### Requirement 9: Cierre del modal

**User Story:** Como usuario, quiero poder cerrar el modal de creación, para cancelar o finalizar el flujo.

#### Acceptance Criteria

1. WHEN el usuario activa el control de cierre del Modal_Crear_Proyecto, THE Modulo_Crear_Proyecto SHALL cerrar el modal quitando el estado visible (clase 'abierto') sin persistir datos.
2. WHEN el usuario activa el área externa al contenido del Modal_Crear_Proyecto (clic sobre el overlay, no sobre el cajón interno), THE Modulo_Crear_Proyecto SHALL cerrar el modal sin persistir datos.
3. WHEN el usuario guarda un Proyecto válido, THE Modulo_Crear_Proyecto SHALL cerrar el Modal_Crear_Proyecto tras completar la persistencia en `datosSheets`.
4. IF ocurre un error durante la persistencia al guardar, THEN THE Modulo_Crear_Proyecto SHALL mantener el modal abierto e informar al usuario que el guardado no se completó.

### Requirement 10: Presentación adaptable y coherente

**User Story:** Como usuario, quiero que el modal se adapte al contenido y respete el diseño de la App, para ver todos los datos sin fricción y con una experiencia consistente.

#### Acceptance Criteria

1. WHILE el usuario agrega hospitales o líneas de RRHH, THE Modal_Crear_Proyecto SHALL expandir su contenedor para acomodar el contenido según la regla de contenedores adaptables de `contrato.md`, hasta un máximo de 95vw de ancho y 95vh de alto.
2. WHEN el contenido del Modal_Crear_Proyecto excede la altura disponible (95vh), THE Modal_Crear_Proyecto SHALL habilitar desplazamiento interno para acceder a todo el contenido sin recortarlo.
3. THE Modal_Crear_Proyecto SHALL usar la paleta fija (principal #153244, secundario #8de2d6, terciario #ffcc00) y la tipografía Montserrat.
4. WHILE el ancho de la ventana es de 768px o menos, THE Modal_Crear_Proyecto SHALL colapsar la grilla de cada Linea_RRHH a 2 columnas y ocupar el ancho disponible sin desborde horizontal.

### Requirement 11: Ausencia de regresiones

**User Story:** Como usuario, quiero que el nuevo módulo no altere las funciones existentes, para seguir usando la App con normalidad.

#### Acceptance Criteria

1. WHEN el usuario abre y opera el modal CREAR PEDIDO existente, THE Modulo_Crear_Proyecto SHALL mantener idéntico su comportamiento de interfaz y su lógica de guardado (`guardarNuevoPedido`), sin alteraciones.
2. THE Modulo_Crear_Proyecto SHALL evitar colisiones de identificadores entre las líneas de RRHH del Modal_Crear_Proyecto y las del modal CREAR PEDIDO.
3. WHEN el usuario usa la Barra_Etiquetas, la búsqueda avanzada o la navegación entre hospitales y agrupadores, THE Modulo_Crear_Proyecto SHALL preservar su comportamiento existente (`calcularEtiquetas`, filtros, navegación) sin regresiones.
4. THE Modulo_Crear_Proyecto SHALL implementarse íntegramente dentro de `OBRAS v9.html`, sin agregar dependencias externas ni archivos nuevos.
