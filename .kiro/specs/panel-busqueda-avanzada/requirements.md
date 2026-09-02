
# Requirements Document

## Introduction

Se agrega un Panel de Búsqueda Avanzada a la aplicación "Plataforma de Gestión - Hospitales" (OBRAS v9.html). La funcionalidad permite al usuario filtrar pedidos de obra por múltiples dimensiones combinadas: período de fechas, tipo de pedido, escalafón/puesto y estado de cargos. El panel se activa desde un botón en el encabezado y opera sobre los datos globales sin modificarlos, coexistiendo con el sistema de chips de estado existente (ACTIVOS / DESPRIORIZADOS / RESUELTOS). Los presets de período se calculan sobre un año de referencia seleccionable, pensado para planificación por ejercicio presupuestario. Cuando no hay hospital seleccionado, el sistema entra en modo de búsqueda global que consolida resultados de todos los efectores y ofrece un selector para acotar por hospital sin abandonar dicho modo. La cantidad de pedidos mostrados se refleja en un contador de registros permanente, y el listado de hospitales es completamente accesible en dispositivos móviles.

---

## Glossary

- **Sistema**: La aplicación web "OBRAS v9.html", implementada en un único archivo HTML con JS vanilla puro, sin dependencias externas ni frameworks.
- **Pedido**: Registro individual de una solicitud de obra o dotación para un efector, identificado por un ID único. Contiene tipo, fecha, estado general, detalle y una lista de cargos.
- **Cajón**: Elemento visual desplegable en la columna central que representa un pedido de obra. Se expande para mostrar los cargos y el detalle.
- **Efector / Hospital**: Unidad de salud destinataria del pedido (ej. Hospital Alvear, CESAC 3). Actúa como agrupador de pedidos.
- **Cargo**: Subunidad dentro de un pedido que describe un puesto a cubrir, con atributos: escalafón, puesto, qAprobado, validado, expediente y resuelto.
- **Escalafón**: Categoría laboral del cargo (ej. ENFERMERÍA, MÉDICOS, ADMINISTRATIVOS).
- **Puesto**: Denominación específica del cargo dentro del escalafón (campo de texto libre en los datos).
- **Estado general**: Valor que clasifica un pedido como ACTIVO, DESPRIORIZADO o RESUELTO. Es gestionado por el sistema de chips existente, independiente del filtro avanzado.
- **Filtro avanzado**: Conjunto de criterios de búsqueda gestionados por el Panel de Búsqueda Avanzada, almacenados en el objeto global `filtrosBusqueda`.
- **Modo búsqueda global**: Estado del Sistema activado cuando no hay efector seleccionado al aplicar el filtro avanzado; muestra resultados de todos los efectores en la columna central.
- **Banner de filtro activo**: Indicador visual persistente que aparece en la columna central cuando hay criterios de filtro avanzado aplicados.
- **Preset de fecha**: Chip clicable que pre-rellena automáticamente un rango de fechas correspondiente a una división (bimestre, trimestre, cuatrimestre, semestre o año completo) del Año de referencia seleccionado.
- **Año de referencia**: Año calendario de cuatro dígitos seleccionado por el usuario dentro del Tab_Periodo, sobre el cual los presets de fecha calculan sus rangos. Por defecto es el año actual del navegador.
- **Selector de año**: Control del Tab_Periodo que permite al usuario elegir el Año de referencia entre un conjunto de años derivado de los datos y sus años adyacentes.
- **Calendario interactivo**: Componente de selección visual de rango de fechas con navegación mensual integrado en el Modal de Búsqueda Avanzada.
- **Selector de hospital global**: Control desplegable ubicado en el encabezado de la vista de resultados globales que permite acotar los resultados a un único efector presente en dichos resultados, o a la opción "Todos", sin desactivar el Modo búsqueda global.
- **Contador de registros**: Indicador visual que muestra la cantidad de pedidos actualmente visibles en la columna central, tanto en vista de efector individual como en Modo búsqueda global.
- **Modal de Búsqueda Avanzada**: Ventana emergente que contiene las cuatro solapas de filtrado, el botón APLICAR y el botón LIMPIAR.
- **datosSheets**: Objeto global de solo lectura que contiene todos los pedidos cargados desde el CSV. El filtro avanzado no lo modifica.
- **catalogos**: Objeto global que contiene listas de valores válidos para tipos de pedido y escalafones, usadas para poblar dinámicamente los controles del modal.

---

## Requirements

### Requirement 1: Acceso al Panel de Búsqueda Avanzada

**User Story:** Como usuario de la plataforma, quiero un botón de búsqueda avanzada siempre visible en el encabezado, para poder iniciar una búsqueda filtrada desde cualquier punto de la aplicación.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar un botón "BUSCAR" con ícono 🔍 en el extremo derecho del encabezado superior en todo momento, independientemente de qué vista esté activa.
2. THE Botón_BUSCAR SHALL aplicar el mismo estilo visual observable (tamaño, tipografía, apariencia de fondo y texto en reposo, hover y foco) que el botón `.btn-inicio-texto` existente en la aplicación.
3. WHEN el usuario hace clic en el Botón_BUSCAR, THE Sistema SHALL abrir el Modal de Búsqueda Avanzada.
4. WHEN el Modal de Búsqueda Avanzada se abre, THE Sistema SHALL poblar dinámicamente los controles de tipo de pedido y escalafón con los valores actuales disponibles en `catalogos.tiposPedido` y `catalogos.escalafones`.
5. IF `catalogos.tiposPedido` o `catalogos.escalafones` no están disponibles al abrir el modal, THEN THE Sistema SHALL mostrar un mensaje de advertencia en la solapa correspondiente indicando que los datos del catálogo no pudieron cargarse.
6. WHEN el usuario presiona la tecla Escape con el Modal_Busqueda abierto, THE Sistema SHALL cerrar el modal sin aplicar cambios.

---

### Requirement 2: Estructura del Modal de Búsqueda Avanzada

**User Story:** Como usuario, quiero un modal organizado en solapas para configurar criterios de búsqueda por dimensiones separadas, para que cada tipo de filtro sea fácil de encontrar y usar.

#### Acceptance Criteria

1. THE Modal_Busqueda SHALL presentar exactamente cuatro solapas en el siguiente orden: "📅 Período", "📋 Tipo de Pedido", "👤 Escalafón / Puesto" y "🔖 Estado de Cargos".
2. WHEN el Modal_Busqueda se abre, THE Sistema SHALL mostrar la solapa "📅 Período" activa y los paneles de las otras tres solapas ocultos.
3. WHEN el usuario hace clic en una solapa inactiva, THE Sistema SHALL mostrar el panel correspondiente a esa solapa y ocultar los paneles de las demás solapas, sin pérdida de los valores ya ingresados en las otras solapas.
4. THE Modal_Busqueda SHALL incluir un botón "APLICAR FILTRO" y un botón "LIMPIAR" en el pie del modal, visibles e interactuables desde cualquier solapa activa.
5. IF el Modal_Busqueda se abre y el contenido de la solapa activa supera el 80% de la altura de la ventana del navegador, THEN THE Sistema SHALL habilitar scroll vertical interno dentro del panel de la solapa, sin modificar el tamaño del pie del modal.
6. WHEN el usuario hace clic fuera del área del modal, THE Sistema SHALL cerrar el Modal_Busqueda sin aplicar los criterios de búsqueda configurados y sin modificar los filtros activos vigentes.
7. WHEN el usuario hace clic en "LIMPIAR", THE Sistema SHALL restablecer todos los criterios de búsqueda de las cuatro solapas a su estado vacío o valor por defecto, sin cerrar el modal.

---

### Requirement 3: Filtrado por Período de Fechas

**User Story:** Como usuario responsable de planificación por ejercicio presupuestario, quiero filtrar pedidos por divisiones de un año seleccionado (bimestre, trimestre, etc.) o por selección manual en un calendario, para encontrar pedidos dentro del ejercicio de gestión que me interesa sin quedar anclado a la fecha actual.

#### Acceptance Criteria

1. THE Tab_Periodo SHALL mostrar cinco chips de preset: "Bimestre", "Trimestre", "Cuatrimestre", "Semestre" y "Año".
2. WHEN el Tab_Periodo se muestra, THE Sistema SHALL mostrar un Selector de año que permita elegir el Año de referencia, inicializado con el año actual del navegador y con opciones que incluyan los años presentes en `datosSheets` y el año inmediatamente anterior y posterior a ese conjunto.
3. WHEN el usuario cambia el valor del Selector de año, THE Sistema SHALL establecer ese valor como Año de referencia para el cálculo posterior de los presets de fecha, sin modificar los campos de fecha de inicio y fin ya seleccionados.
4. WHEN el usuario hace clic en el chip "Año", THE Sistema SHALL establecer la fecha de inicio como el 1 de enero y la fecha de fin como el 31 de diciembre del Año de referencia, pre-rellenando los campos de fecha inicio y fin con esos valores.
5. WHEN el usuario hace clic en el chip "Semestre", THE Sistema SHALL ofrecer las dos divisiones semestrales del Año de referencia (S1: enero–junio, S2: julio–diciembre) y, al elegir una, establecer la fecha de inicio en el primer día del primer mes de esa división y la fecha de fin en el último día del último mes de esa división.
6. WHEN el usuario hace clic en el chip "Cuatrimestre", THE Sistema SHALL ofrecer las tres divisiones cuatrimestrales del Año de referencia (C1: enero–abril, C2: mayo–agosto, C3: septiembre–diciembre) y, al elegir una, establecer la fecha de inicio en el primer día del primer mes de esa división y la fecha de fin en el último día del último mes de esa división.
7. WHEN el usuario hace clic en el chip "Trimestre", THE Sistema SHALL ofrecer las cuatro divisiones trimestrales del Año de referencia (Q1: enero–marzo, Q2: abril–junio, Q3: julio–septiembre, Q4: octubre–diciembre) y, al elegir una, establecer la fecha de inicio en el primer día del primer mes de esa división y la fecha de fin en el último día del último mes de esa división.
8. WHEN el usuario hace clic en el chip "Bimestre", THE Sistema SHALL ofrecer las seis divisiones bimestrales del Año de referencia (B1: enero–febrero, B2: marzo–abril, B3: mayo–junio, B4: julio–agosto, B5: septiembre–octubre, B6: noviembre–diciembre) y, al elegir una, establecer la fecha de inicio en el primer día del primer mes de esa división y la fecha de fin en el último día del último mes de esa división.
9. THE Tab_Periodo SHALL mostrar un calendario de navegación mensual con una grilla de 7 columnas (una por día de la semana) que permite avanzar y retroceder de mes en mes.
10. WHEN el usuario hace clic en un día del calendario y no existe fecha de inicio seleccionada o ya existe un rango completo seleccionado, THE Sistema SHALL establecer ese día como la nueva fecha de inicio y limpiar cualquier fecha de fin previamente seleccionada.
11. WHEN el usuario hace clic en un segundo día del calendario y ya existe una fecha de inicio seleccionada sin fecha de fin, THE Sistema SHALL marcar ese día como fecha de fin del rango.
12. IF la fecha de fin seleccionada es anterior a la fecha de inicio, THEN THE Sistema SHALL intercambiar automáticamente los valores de inicio y fin de modo que el menor valor quede como fecha de inicio y el mayor como fecha de fin.
13. WHILE un rango está seleccionado, THE Sistema SHALL pintar los días intermedios (excluyendo los días extremos) con fondo `rgba(141, 226, 214, 0.4)` y los días de inicio y fin con fondo `#153244` y texto blanco.
14. WHEN el campo `fecha` de un pedido contiene únicamente un año en formato de 4 dígitos (ej. `"2026"`), THE Sistema SHALL interpretar ese pedido como cubriendo el rango completo del 1 de enero al 31 de diciembre de ese año para la evaluación del filtro.
15. WHEN el campo `fecha` de un pedido contiene el valor `"-"` o está vacío, THE Sistema SHALL excluir ese pedido de los resultados cuando el filtro de período está activo.
16. WHEN el campo `fecha` de un pedido contiene una fecha con hora en formato `"YYYY-MM-DD HH:MM:SS"`, THE Sistema SHALL utilizar únicamente la parte de fecha (YYYY-MM-DD), ignorando la hora, para la comparación, incluyendo el pedido si su fecha es mayor o igual a la fecha de inicio y menor o igual a la fecha de fin del rango seleccionado.
17. IF el campo `fecha` de un pedido no corresponde a ninguno de los formatos reconocidos (año de 4 dígitos, fecha con hora, o fecha ISO completa), THEN THE Sistema SHALL excluir ese pedido de los resultados cuando el filtro de período está activo.

---

### Requirement 4: Filtrado por Tipo de Pedido

**User Story:** Como usuario, quiero filtrar pedidos por su tipo (Obra, Ampliacion de dotación, etc.), para concentrarme en la categoría de gestión que me interesa.

#### Acceptance Criteria

1. WHEN el Modal_Busqueda se abre, THE Sistema SHALL mostrar un checkbox por cada valor disponible en `catalogos.tiposPedido`, reflejando el contenido actual del catálogo en ese momento.
2. WHEN el Modal_Busqueda se abre, THE Sistema SHALL marcar todos los checkboxes de tipo como seleccionados por defecto, lo que equivale a sin restricción de tipo.
3. WHEN el usuario desmarca uno o más tipos y aplica el filtro, THE Sistema SHALL incluir en los resultados únicamente los pedidos cuyo campo `tipo` coincida exactamente con alguno de los tipos seleccionados.
4. IF ningún checkbox de tipo está marcado o no existen checkboxes de tipo disponibles, THEN THE Sistema SHALL tratar el filtro de tipo como sin restricción e incluir pedidos de cualquier tipo.
5. IF `catalogos.tiposPedido` no está disponible al abrir el Modal_Busqueda, THEN THE Sistema SHALL mostrar un mensaje de error indicando que los tipos de pedido no pudieron cargarse y tratar el filtro de tipo como sin restricción.

---

### Requirement 5: Filtrado por Escalafón y Puesto

**User Story:** Como usuario, quiero buscar pedidos que contengan cargos de un escalafón específico o con una denominación de puesto determinada, para identificar pedidos relacionados con perfiles concretos.

#### Acceptance Criteria

1. THE Tab_Escalafon SHALL mostrar una lista de checkboxes con todos los escalafones disponibles en `catalogos.escalafones`.
2. THE Tab_Escalafon SHALL incluir un campo de texto libre con etiqueta "Puesto contiene..." con un máximo de 100 caracteres, para búsqueda parcial sobre el campo `puesto` de cada cargo.
3. WHEN el usuario aplica el filtro con escalafones seleccionados y/o texto de puesto, THE Sistema SHALL incluir en los resultados únicamente los pedidos que contengan al menos un cargo donde el escalafón esté dentro de los seleccionados (o ninguno seleccionado) Y el campo `puesto` contenga el texto ingresado de forma insensible a mayúsculas/minúsculas (o el campo esté vacío).
4. IF `catalogos.escalafones` no está disponible al abrir el Modal_Busqueda, THEN THE Sistema SHALL deshabilitar los checkboxes de escalafón y mostrar un mensaje informativo indicando que los datos no pudieron cargarse.
5. IF no hay escalafones seleccionados y el campo de texto de puesto está vacío, THEN THE Sistema SHALL tratar el Tab_Escalafon como sin restricción.

---

### Requirement 6: Filtrado por Estado de Cargos

**User Story:** Como usuario, quiero filtrar pedidos según el estado agregado de sus cargos (validación, expediente, resolución), para detectar pedidos que requieren atención específica.

#### Acceptance Criteria

1. THE Tab_Estado SHALL mostrar cinco checkboxes: "Con al menos 1 cargo validado", "Con todos los cargos validados", "Con Q aprobado > 0", "Sin expediente cargado" y "Con cargos pendientes (no resueltos)".
2. WHEN el usuario marca "Con al menos 1 cargo validado" y aplica el filtro, THE Sistema SHALL incluir únicamente pedidos donde al menos un cargo tenga `validado === true`.
3. WHEN el usuario marca "Con todos los cargos validados" y aplica el filtro, THE Sistema SHALL incluir únicamente pedidos donde todos los cargos tengan `validado === true`.
4. WHEN el usuario marca "Con Q aprobado > 0" y aplica el filtro, THE Sistema SHALL incluir únicamente pedidos donde al menos un cargo tenga `qAprobado > 0`.
5. WHEN el usuario marca "Sin expediente cargado" y aplica el filtro, THE Sistema SHALL incluir únicamente pedidos donde al menos un cargo tenga el campo `expediente` con valor `null`, `undefined`, `""` o `"-"`.
6. WHEN el usuario marca "Con cargos pendientes (no resueltos)" y aplica el filtro, THE Sistema SHALL incluir únicamente pedidos donde al menos un cargo tenga `resuelto` con valor `false`, `null` o `undefined`.
7. WHEN el usuario tiene dos o más checkboxes de estado marcados y aplica el filtro, THE Sistema SHALL aplicar todos los criterios activos con lógica AND, incluyendo únicamente pedidos que satisfagan cada condición marcada.
8. IF ningún checkbox de estado está marcado, THEN THE Sistema SHALL tratar el Tab_Estado como sin restricción.
9. IF un pedido no tiene cargos (lista de cargos vacía), THEN THE Sistema SHALL excluir ese pedido de los resultados cuando cualquiera de los checkboxes de estado esté marcado.

---

### Requirement 7: Aplicación combinada de filtros y coexistencia con chips de estado

**User Story:** Como usuario, quiero que los filtros avanzados se combinen entre sí y con el sistema de chips ACTIVOS/DESPRIORIZADOS/RESUELTOS, para obtener resultados precisos sin perder el contexto de estado de los pedidos.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "APLICAR FILTRO", THE Sistema SHALL guardar todos los criterios configurados en el objeto global `filtrosBusqueda`, cerrar el modal en menos de 300ms y actualizar la columna central con los pedidos que satisfagan todos los filtros activos en menos de 1000ms.
2. WHEN se evalúa qué pedidos mostrar, THE Sistema SHALL aplicar primero el filtro de estado existente (ACTIVOS/DESPRIORIZADOS/RESUELTOS) y luego, sobre ese subconjunto ya filtrado, el filtro avanzado, en serie.
3. WHEN múltiples tabs del Modal_Busqueda tienen criterios configurados (activos), THE Sistema SHALL combinar todos los criterios activos con lógica AND: un pedido aparece en resultados solo si pasa todos los filtros configurados simultáneamente.
4. IF `filtrosBusqueda.activo` es `false`, THEN THE Sistema SHALL renderizar los pedidos del subconjunto del chip de estado activo sin aplicar ningún criterio del filtro avanzado, preservando el chip de estado seleccionado.
5. IF los criterios del filtro avanzado aplicados sobre el subconjunto del chip de estado activo no producen ningún resultado, THEN THE Sistema SHALL mostrar el mensaje "Sin resultados para los criterios seleccionados." en la columna central.

---

### Requirement 8: Modo Búsqueda Global

**User Story:** Como usuario, quiero poder buscar en todos los hospitales a la vez cuando no tengo uno seleccionado, para identificar pedidos que cumplan mis criterios en toda la plataforma.

#### Acceptance Criteria

1. WHEN el usuario aplica el filtro avanzado sin tener ningún efector seleccionado, THE Sistema SHALL activar el modo búsqueda global y mostrar resultados de todos los efectores en la columna central.
2. WHILE el modo búsqueda global está activo, THE Sistema SHALL mostrar en la columna central todos los cajones de pedidos de todos los efectores que satisfagan los criterios del filtro avanzado.
3. WHILE el modo búsqueda global está activo, THE Sistema SHALL mostrar una etiqueta con el nombre del efector en cada cajón para identificar su origen.
4. WHILE el modo búsqueda global está activo, THE Sistema SHALL mostrar el texto "Resultados de búsqueda" como encabezado de la columna central en lugar del nombre de un hospital.
5. IF la búsqueda global no encuentra pedidos que satisfagan los criterios, THEN THE Sistema SHALL mostrar el mensaje "Sin resultados para los criterios seleccionados." en la columna central.
6. WHEN el usuario selecciona un efector desde el panel de efectores mientras el modo búsqueda global está activo, THE Sistema SHALL desactivar el modo búsqueda global y mostrar los pedidos del efector seleccionado aplicando los filtros avanzados vigentes.
7. WHEN el usuario limpia el filtro avanzado mientras el modo búsqueda global está activo, THE Sistema SHALL desactivar el modo búsqueda global y volver a la vista inicial sin efector seleccionado.
8. WHILE el modo búsqueda global está activo, THE Sistema SHALL mostrar en el encabezado de la vista de resultados globales un Selector de hospital global desplegable que liste una opción "Todos" y un elemento por cada efector distinto presente en los resultados actuales del filtro avanzado.
9. WHEN el usuario elige un efector en el Selector de hospital global, THE Sistema SHALL acotar los cajones visibles en la columna central a los pedidos de ese efector, conservando activos el modo búsqueda global y los criterios del filtro avanzado vigente sin modificar `filtrosBusqueda`.
10. WHEN el usuario elige la opción "Todos" en el Selector de hospital global, THE Sistema SHALL volver a mostrar los cajones de todos los efectores que satisfacen los criterios del filtro avanzado, conservando activo el modo búsqueda global.
11. WHEN los criterios del filtro avanzado se modifican y se reejecuta la búsqueda global, THE Sistema SHALL reconstruir la lista de opciones del Selector de hospital global a partir de los efectores presentes en los nuevos resultados y restablecer la selección en la opción "Todos".
12. IF el efector actualmente elegido en el Selector de hospital global deja de estar presente en los resultados tras un cambio de filtro, THEN THE Sistema SHALL restablecer la selección en la opción "Todos" y mostrar los resultados de todos los efectores.

---

### Requirement 9: Banner de Filtro Activo y Limpieza

**User Story:** Como usuario, quiero saber en todo momento si hay un filtro avanzado activo y poder limpiarlo con un solo clic, para no perder de vista el contexto de filtrado y volver al estado normal fácilmente.

#### Acceptance Criteria

1. WHEN `filtrosBusqueda.activo` es `true`, THE Sistema SHALL mostrar un banner visible debajo del encabezado de la columna central con fondo `#ffcc00` y texto `#153244`.
2. THE Banner_Filtro SHALL incluir una descripción textual de los criterios activos, listando únicamente las dimensiones con valores configurados (entre 1 y 4: período, tipos, escalafón/puesto, estado de cargos) y un botón "✕ Limpiar".
3. WHEN el usuario hace clic en "✕ Limpiar" del banner, THE Sistema SHALL restablecer `filtrosBusqueda` a su estado vacío con `filtrosBusqueda.activo = false`, ocultar el banner y volver al estado de renderizado previo (efector activo o vista inicial).
4. WHEN el usuario hace clic en "LIMPIAR" dentro del Modal_Busqueda, THE Sistema SHALL restablecer todos los controles del modal a sus valores por defecto sin cerrar el modal y sin modificar `filtrosBusqueda.activo`.
5. WHEN `filtrosBusqueda.activo` es `false`, THE Sistema SHALL mantener el banner oculto, independientemente del estado de los controles del modal.
6. IF la operación de limpieza desde el banner falla, THEN THE Sistema SHALL preservar el estado actual de `filtrosBusqueda` y notificar al usuario con un mensaje de error.

---

### Requirement 10: Contador de Registros Visibles

**User Story:** Como usuario, quiero ver en todo momento cuántos pedidos se están mostrando en pantalla, para tomar dimensión del volumen de resultados con o sin filtros aplicados.

#### Acceptance Criteria

1. WHILE la columna central muestra pedidos en la vista de un efector individual, THE Sistema SHALL mostrar un Contador de registros visible con la cantidad de pedidos actualmente renderizados en la columna central.
2. WHILE el modo búsqueda global está activo, THE Sistema SHALL mostrar el Contador de registros con la cantidad de pedidos actualmente visibles en la columna central, considerando la acotación del Selector de hospital global cuando exista.
3. WHEN el usuario cambia el chip de estado (ACTIVOS, DESPRIORIZADOS o RESUELTOS), THE Sistema SHALL actualizar el valor del Contador de registros para reflejar la nueva cantidad de pedidos mostrados.
4. WHEN el usuario aplica, modifica o limpia el filtro avanzado, THE Sistema SHALL actualizar el valor del Contador de registros para reflejar la nueva cantidad de pedidos mostrados.
5. WHEN el usuario cambia la selección del Selector de hospital global, THE Sistema SHALL actualizar el valor del Contador de registros para reflejar la cantidad de pedidos del efector elegido o del conjunto completo.
6. IF la cantidad de pedidos mostrados es cero, THEN THE Sistema SHALL mostrar el Contador de registros con el valor cero.
7. THE Contador de registros SHALL respetar la paleta de colores del contrato — color principal `#153244`, color secundario `#8de2d6` y color terciario `#ffcc00` — presentándose de forma discreta y legible.

---

### Requirement 11: Accesibilidad del Listado de Hospitales en Móvil

**User Story:** Como usuario en un dispositivo móvil, quiero poder desplazarme por la lista completa de hospitales, para acceder a todos los agrupadores e independientes sin que queden cortados.

#### Acceptance Criteria

1. WHEN el panel izquierdo de hospitales se muestra en una pantalla con ancho máximo de 768px, THE Sistema SHALL permitir el acceso a la totalidad de los efectores del listado, incluyendo todos los agrupadores e independientes, sin que ningún elemento quede truncado o inaccesible.
2. WHERE el listado de hospitales excede la altura disponible en una pantalla con ancho máximo de 768px, THE Sistema SHALL habilitar desplazamiento vertical sobre el listado que permita alcanzar el último elemento del mismo.
3. WHEN el panel izquierdo de hospitales se muestra en una pantalla con ancho máximo de 768px, THE Sistema SHALL mostrar todos los agrupadores del listado sin restringir la vista a una cantidad fija de ellos.
4. THE Sistema SHALL conservar en móvil el comportamiento de expansión y colapso existente de los agrupadores del listado de hospitales.

---

### Requirement 12: Restricciones Técnicas y No Funcionales

**User Story:** Como desarrollador responsable del mantenimiento, quiero que la implementación respete las restricciones arquitectónicas del proyecto para asegurar consistencia y facilidad de mantenimiento.

#### Acceptance Criteria

1. THE Sistema SHALL implementar el Panel de Búsqueda Avanzada completamente dentro del archivo único `OBRAS v9.html`, sin agregar archivos externos ni dependencias de terceros.
2. THE Sistema SHALL implementar el calendario interactivo con JS vanilla y CSS Grid nativo, sin librerías de calendario externas.
3. THE Sistema SHALL respetar la paleta de colores del contrato — color principal `#153244`, color secundario `#8de2d6` y color terciario `#ffcc00` — en todos los estados visuales (reposo, hover, foco, activo) de los elementos nuevos del Panel de Búsqueda Avanzada.
4. THE Sistema SHALL operar sobre `datosSheets` en modo de solo lectura; el filtro avanzado no modificará ni mutará el objeto de datos global.
5. WHEN el Modal_Busqueda se muestra en una pantalla con ancho máximo de 768px, THE Sistema SHALL adaptar el modal al 95% del ancho disponible, reorganizar los chips de preset en dos columnas y garantizar que el calendario quepa dentro del modal sin desbordamiento horizontal.
6. WHEN se aplica un filtro avanzado sobre un conjunto de hasta 500 pedidos, THE Sistema SHALL completar el renderizado de resultados en la columna central en menos de 500ms, medidos desde el momento en que el usuario confirma el filtro hasta que los resultados son visibles en el DOM.
7. THE Botón_BUSCAR, el Modal_Busqueda y todos sus controles interactivos SHALL incluir atributos `aria-label` no vacíos que identifiquen el propósito de cada elemento de forma que un lector de pantalla pueda anunciarlo sin contexto visual adicional.
