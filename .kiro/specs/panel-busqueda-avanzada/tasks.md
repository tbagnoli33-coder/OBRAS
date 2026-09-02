# Implementation Plan: Panel de Búsqueda Avanzada

## Overview

Implementación del Panel de Búsqueda Avanzada dentro del archivo único `OBRAS v9.html`. La feature agrega un botón "BUSCAR" en el encabezado que abre un modal con cuatro solapas de filtrado. Los filtros operan en serie sobre los filtros de estado existentes (ACTIVOS/DESPRIORIZADOS/RESUELTOS), sin modificar `datosSheets`. El estado se almacena en el objeto global `filtrosBusqueda`.

---

## Tasks

- [x] 1. Inicializar el estado global `filtrosBusqueda`
  - [x] 1.1 Declarar e inicializar el objeto `filtrosBusqueda` en el bloque de variables globales de `OBRAS v9.html`, junto a `filtrosActivos` y `hospitalActual`
    - El objeto debe contener: `activo`, `fechaDesde`, `fechaHasta`, `tiposSeleccionados`, `escalafonesSeleccionados`, `textoPuesto`, `estadosCargo` (5 flags booleanos) y `modoGlobal`
    - Valor inicial: todos los campos en `false`, `null` o `[]` según su tipo (sin restricciones activas)
    - _Requirements: 7.4_

- [x] 2. Agregar estilos CSS para el modal y sus componentes
  - [x] 2.1 Agregar estilos para el modal de búsqueda avanzada (`#modal-busqueda`) y el botón "BUSCAR" del encabezado
    - El panel interior del modal debe tener `max-width: 620px`, sin altura fija, adaptable al contenido
    - El botón "BUSCAR" debe seguir el mismo patrón visual que `.btn-inicio-texto` (misma fuente, borde, border-radius, padding, colores, transiciones), diferenciándose solo en contenido
    - Incluir `aria-label` en el botón BUSCAR: `aria-label="Abrir búsqueda avanzada"`
    - _Requirements: 1.1, 1.2, 10.3, 10.7_
  - [x] 2.2 Agregar estilos para las solapas (tabs) del modal
    - Tab inactiva: fondo `#e8ecef`, color `var(--azul-oscuro)`; tab activa: fondo `#153244`, color blanco
    - Incluir estados hover y foco respetando la paleta de colores del contrato
    - _Requirements: 2.1, 2.2, 2.3, 10.3_
  - [x] 2.3 Agregar estilos para el calendario interactivo de rango de fechas
    - Usar `display: grid; grid-template-columns: repeat(7, 1fr)` para la grilla de días
    - Clase `.cal-extremo`: fondo `#153244`, texto blanco, `border-radius: 50%`
    - Clase `.cal-rango`: fondo `rgba(141, 226, 214, 0.4)`
    - Clase `.cal-dia`: sin relleno especial; hover con fondo `#8de2d6` traslúcido
    - _Requirements: 3.3, 3.7, 10.2, 10.3_
  - [x] 2.4 Agregar estilos para los chips de preset de fechas, checkboxes de tipo/escalafón/estado, y el pie del modal
    - Chips de preset: borde `#153244`, hover con fondo `#8de2d6`; cuando un chip está activo, fondo `#153244` y texto blanco
    - Footer del modal: fondo levemente separado, botones "APLICAR FILTRO" y "LIMPIAR" visibles desde cualquier solapa
    - Habilitar scroll interno en el panel de la solapa cuando el contenido supera el 80% de la altura del viewport (`overflow-y: auto; max-height: 60vh` en `.tab-panel`)
    - _Requirements: 2.4, 2.5, 3.1, 10.3_
  - [x] 2.5 Agregar estilos para el banner de filtro activo
    - `#banner-filtro-activo`: fondo `#ffcc00`, color `#153244`, oculto por defecto (`display: none`)
    - Botón "✕ Limpiar" dentro del banner con estilo coherente con la paleta
    - _Requirements: 9.1, 9.5, 10.3_
  - [ ]* 2.6 Agregar media query `max-width: 768px` para el modal y el calendario
    - Modal al 95% del ancho disponible
    - Chips de preset reorganizados en 2 columnas (`grid-template-columns: repeat(2, 1fr)`)
    - Calendario comprimido para no generar desbordamiento horizontal
    - _Requirements: 10.5_

- [x] 3. Insertar el HTML del modal y el botón BUSCAR
  - [x] 3.1 Insertar el `<div id="modal-busqueda" class="modal-overlay">` con la estructura completa de cuatro solapas dentro de `OBRAS v9.html`, antes del cierre de `</body>`
    - Seguir la estructura DOM del diseño: overlay → panel → encabezado h2 → barra de tabs → cuatro `div.tab-panel` → footer con botones
    - IDs de tabs: `tab-fechas`, `tab-tipo`, `tab-escalafon`, `tab-estado`
    - Footer con `button#btn-limpiar-busq` y `button#btn-aplicar-busq`
    - Atributos `aria-label` en todos los botones y controles interactivos del modal
    - Cerrar modal al hacer clic en el overlay (fuera del panel) mediante `onclick="cerrarModalBusquedaAfuera(event)"`
    - _Requirements: 2.1, 2.2, 2.4, 10.7_
  - [x] 3.2 Poblar el contenido de cada tab-panel con sus controles
    - `#tab-fechas`: chips de presets (Bimestre, Trimestre, Cuatrimestre, Semestre, Año), navegación de mes (← / →), encabezado del mes, cabecera de días de la semana, y contenedor `#cal-grilla` para los días generados por JS
    - `#tab-tipo`: `<div id="lista-tipos-busqueda">` — se poblará dinámicamente desde `catalogos.tiposPedido` al abrir el modal
    - `#tab-escalafon`: `<div id="lista-escalafones-busqueda">` (dinámico) y `<input type="text" id="input-puesto-busqueda" maxlength="100">` con label "Puesto contiene..."
    - `#tab-estado`: cinco checkboxes con IDs `cb-al-menos-validado`, `cb-todos-validados`, `cb-q-aprobado`, `cb-sin-expediente`, `cb-con-pendientes`
    - _Requirements: 3.1, 4.1, 5.1, 5.2, 6.1, 10.7_
  - [x] 3.3 Insertar el botón "BUSCAR" con ícono 🔍 en el extremo derecho del `<header class="encabezado-superior">`, con `onclick="abrirModalBusqueda()"` y `aria-label="Abrir búsqueda avanzada"`
    - Usar `margin-left: auto` en el botón (o en un contenedor wraper) para posicionarlo al extremo derecho del flex header
    - _Requirements: 1.1, 1.2, 1.3, 10.7_
  - [x] 3.4 Insertar el `<div id="banner-filtro-activo">` en la columna central, debajo del encabezado del hospital y antes de la grilla de pedidos
    - Contenido: `<span id="banner-descripcion-filtro">` para el texto de criterios activos y `<button onclick="limpiarBusqueda()">✕ Limpiar</button>`
    - El banner empieza oculto (`display: none`)
    - _Requirements: 9.1, 9.2, 9.5_

- [x] 4. Implementar la lógica de apertura/cierre y tabs del modal
  - [x] 4.1 Implementar `abrirModalBusqueda()`: agrega clase `abierto` al overlay, pobla dinámicamente `#lista-tipos-busqueda` con checkboxes desde `catalogos.tiposPedido` y `#lista-escalafones-busqueda` desde `catalogos.escalafones`, activa la tab "fechas" por defecto, y renderiza el calendario
    - Si `catalogos.tiposPedido` o `catalogos.escalafones` no están disponibles, mostrar mensaje de advertencia en la solapa correspondiente
    - Todos los checkboxes de tipo deben iniciarse marcados (= sin restricción)
    - Si `filtrosBusqueda.activo` es true al abrir, re-hidratar los controles con los valores actuales de `filtrosBusqueda`
    - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.2, 5.1, 5.4_
  - [x] 4.2 Implementar `cerrarModalBusqueda()`: quita la clase `abierto` del overlay
    - Agregar listener `keydown` en `document` para cerrar con tecla Escape: `if (e.key === 'Escape') cerrarModalBusqueda()`
    - Implementar `cerrarModalBusquedaAfuera(event)`: cierra el modal solo si `event.target === overlay` (clic fuera del panel)
    - En ambos casos: no modificar `filtrosBusqueda` ni los controles del modal
    - _Requirements: 1.6, 2.6_
  - [x] 4.3 Implementar `cambiarTabBusqueda(nombreTab)`: activa la tab seleccionada y oculta las demás sin perder valores ya ingresados
    - Actualizar clases activas en los botones `.tab-btn` y visibilidad de los `.tab-panel`
    - _Requirements: 2.2, 2.3_

- [x] 5. Implementar el calendario interactivo de rango de fechas
  - [x] 5.1 Implementar el objeto de estado local `estadoCal` con `mesVisible`, `fechaInicio`, `fechaFin`
    - Implementar `renderizarCalendario()`: genera las celdas del mes visible en `#cal-grilla` con CSS Grid 7 columnas, aplica clases `.cal-extremo`, `.cal-rango` o `.cal-dia` según posición en el rango, y actualiza el encabezado del mes/año visible
    - Implementar `calcularClaseDia(dia, inicio, fin)` según la lógica del diseño
    - _Requirements: 3.3, 3.7, 10.2_
  - [x] 5.2 Implementar `onClickDia(dia)`: primer clic establece `fechaInicio` (y limpia `fechaFin`); segundo clic establece `fechaFin` con intercambio automático si la fecha de fin es anterior al inicio; en ambos casos llama a `renderizarCalendario()`
    - Implementar `sincronizarInputsConCal()`: actualiza los campos de texto de fecha inicio y fin con el rango seleccionado en formato `YYYY-MM-DD`
    - _Requirements: 3.4, 3.5, 3.6_
  - [x] 5.3 Implementar la navegación de mes: botones "←" y "→" modifican `estadoCal.mesVisible` (retrocede o avanza un mes) y llaman a `renderizarCalendario()`
    - _Requirements: 3.3_
  - [x] 5.4 Implementar los chips de preset de fechas: `aplicarPreset(meses)` calcula `fechaHasta = hoy` y `fechaDesde = hoy retrocedido meses meses`, asigna a `estadoCal.fechaInicio` y `estadoCal.fechaFin`, sincroniza el mes visible al mes de `fechaDesde`, y llama a `renderizarCalendario()`
    - Los cinco chips llaman a `aplicarPreset` con 2, 3, 4, 6 y 12 respectivamente
    - Marcar visualmente el chip activo (clase CSS activa)
    - _Requirements: 3.2_

- [x] 6. Implementar las funciones de filtrado
  - [x] 6.1 Implementar `parsearFecha(valorFecha)`: retorna `{ desde: Date, hasta: Date }` o `null`
    - Casos: `null`/`""`/`"-"` → `null`; solo año 4 dígitos (`/^\d{4}$/`) → `{ desde: new Date(año,0,1), hasta: new Date(año,11,31) }`; fecha con hora o ISO completa → parsear con `new Date(valor)`, si inválida → `null`, si válida → `{ desde: fecha, hasta: fecha }`
    - _Requirements: 3.8, 3.9, 3.10, 3.11_
  - [x] 6.2 Implementar `pedidoPasaFiltroFechas(pedido, fechaDesde, fechaHasta)`: retorna `true` si existe solapamiento entre `[rango.desde, rango.hasta]` del pedido y `[fechaDesde, fechaHasta]`; retorna `true` si ambas fechas de filtro son `null`; retorna `false` si `parsearFecha` retorna `null` con filtro activo
    - _Requirements: 3.8, 3.9, 3.10, 3.11_
  - [x] 6.3 Implementar `pedidoPasaFiltroTipo(pedido, tiposSeleccionados)`: retorna `true` si el array está vacío o si `tiposSeleccionados.includes(pedido.tipo)`; retorna `true` también si ningún checkbox está marcado
    - _Requirements: 4.3, 4.4_
  - [x] 6.4 Implementar `pedidoPasaFiltroEscalafon(pedido, escalafonesSeleccionados, textoPuesto)`: itera sobre `pedido.cargos` buscando al menos uno que cumpla tanto `cumpleEscalafon` como `cumplePuesto`; retorna `true` si ambos filtros están vacíos
    - Comparación de puesto: `cargo.puesto.toLowerCase().includes(textoPuesto.toLowerCase().trim())`
    - _Requirements: 5.3, 5.5_
  - [x] 6.5 Implementar `pedidoPasaFiltroEstadoCargos(pedido, estadosCargo)`: evalúa los cinco flags de `estadosCargo` con AND; retorna `true` si ningún flag está activo; retorna `false` si el pedido no tiene cargos y algún flag está activo
    - Condiciones exactas: `alMenosUnoValidado` → `cargos.some(c => c.validado === true)`, `todosValidados` → `cargos.every(c => c.validado === true)`, `qAprobadoMayorCero` → `cargos.some(c => c.qAprobado > 0)`, `sinExpediente` → `cargos.some(c => !c.expediente || c.expediente === '-')`, `conPendientes` → `cargos.some(c => !c.resuelto)`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [x] 6.6 Implementar `pedidoPasaTodosLosFiltros(pedido)`: retorna `true` si `filtrosBusqueda.activo === false`; de lo contrario combina con AND las cuatro funciones de filtrado anteriores
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 7. Checkpoint — Verificar funciones de filtrado de forma aislada
  - Asegurarse de que las seis funciones del paso 6 puedan ejecutarse desde la consola del navegador con datos de prueba sin errores
  - Pedir al usuario si tiene dudas o ajustes antes de continuar

- [x] 8. Implementar `aplicarBusquedaAvanzada()` y el hook en `entrarHospital()`
  - [x] 8.1 Implementar las funciones de lectura del modal: `leerFechaDesdeModal()`, `leerFechaHastaModal()`, `leerTiposSeleccionados()`, `leerEscalafonesSeleccionados()`, `leerTextoPuesto()`, `leerEstadosCargo()`
    - Cada función lee el estado actual de los controles del DOM y retorna el valor tipado correspondiente
    - _Requirements: 7.1_
  - [x] 8.2 Implementar `hayCriteriosActivos(fb)`: retorna `true` si al menos uno de los campos de `filtrosBusqueda` tiene un valor activo (fechas no nulas, arrays no vacíos, texto no vacío, o algún flag de estado en `true`)
    - _Requirements: 7.1, 9.5_
  - [x] 8.3 Implementar `aplicarBusquedaAvanzada()`: llama a las funciones de lectura, construye el nuevo estado de `filtrosBusqueda`, calcula `filtrosBusqueda.activo` y `filtrosBusqueda.modoGlobal` (`hospitalActual === ""`), cierra el modal, y despacha la renderización
    - Si `modoGlobal` es `true`: llamar a `mostrarResultadosGlobales()`
    - Si no: llamar a `entrarHospital(hospitalActual)`
    - Conectar `button#btn-aplicar-busq` con `onclick="aplicarBusquedaAvanzada()"`
    - _Requirements: 7.1, 7.2, 8.1_
  - [x] 8.4 Modificar `entrarHospital()` en `OBRAS v9.html`: después del bloque `if (!mostrar) return;` que evalúa los chips de estado (ACTIVOS/DESPRIORIZADOS/RESUELTOS), agregar `if (!pedidoPasaTodosLosFiltros(pedido)) return;` para aplicar el filtro avanzado en serie
    - Esta única línea integra el filtro avanzado sin alterar la lógica de chips existente
    - Si la grilla queda vacía tras el filtro, mostrar `<p>"Sin resultados para los criterios seleccionados."</p>` en la columna central
    - _Requirements: 7.2, 7.3, 7.5_

- [x] 9. Implementar `mostrarResultadosGlobales()` (modo búsqueda global)
  - [x] 9.1 Implementar `mostrarResultadosGlobales()`: muestra la columna central con `"Resultados de búsqueda"` como título, oculta la barra de filtros de chips, itera sobre todos los efectores de `datosSheets`, y por cada pedido que pase `pedidoPasaTodosLosFiltros()` genera el HTML del cajón incluyendo una etiqueta con el nombre del efector
    - Si la grilla queda vacía, insertar `"Sin resultados para los criterios seleccionados."`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 9.2 Modificar `entrarHospital()` para que, cuando sea llamada mientras `filtrosBusqueda.modoGlobal === true`, desactive el modo global (`filtrosBusqueda.modoGlobal = false`) y continúe el renderizado normal del hospital seleccionado con los filtros avanzados vigentes
    - _Requirements: 8.6_

- [x] 10. Implementar el banner de filtro activo y `limpiarBusqueda()`
  - [x] 10.1 Implementar `actualizarBannerFiltro()`: si `filtrosBusqueda.activo === true`, construir la descripción textual con `describirFiltroActivo(filtrosBusqueda)` (período, tipos, escalafón/puesto, estado de cargos), actualizar `#banner-descripcion-filtro`, y poner `display: flex` en `#banner-filtro-activo`; si es `false`, ocultar el banner con `display: none`
    - Llamar a `actualizarBannerFiltro()` desde `aplicarBusquedaAvanzada()` y desde `limpiarBusqueda()`
    - _Requirements: 9.1, 9.2, 9.5_
  - [x] 10.2 Implementar `describirFiltroActivo(fb)`: construye el string de descripción de criterios activos (máx. 4 partes separadas por ` · `) según los campos con valores
    - Formato: `"Período: DD/MM/AAAA – DD/MM/AAAA"`, `"Tipos: valor1, valor2"`, `"Escalafón/Puesto: criterios activos"`, `"Estado de cargos: criterios activos"`
    - _Requirements: 9.2_
  - [x] 10.3 Implementar `limpiarBusqueda()`: resetea `filtrosBusqueda` a todos los valores vacíos con `activo: false`; oculta el banner; si `hospitalActual !== ""` llama a `entrarHospital(hospitalActual)`, si no llama a `salirHospital()`; capturar errores con try/catch y notificar al usuario si la limpieza falla
    - Conectar el botón "✕ Limpiar" del banner con `onclick="limpiarBusqueda()"`
    - _Requirements: 9.3, 9.5, 9.6, 8.7_
  - [x] 10.4 Implementar `limpiarControlesModal()`: restablece todos los controles del modal a sus valores por defecto (checkboxes de tipo marcados todos, escalafones desmarcados todos, texto de puesto vacío, checkboxes de estado desmarcados, calendario reseteado) sin cerrar el modal y sin modificar `filtrosBusqueda.activo`
    - Conectar `button#btn-limpiar-busq` con `onclick="limpiarControlesModal()"`
    - _Requirements: 2.7, 9.4_

- [x] 11. Checkpoint final — Integración completa
  - Verificar que el flujo completo funcione: abrir modal → configurar filtros → aplicar → ver resultados → limpiar → volver al estado anterior
  - Verificar búsqueda global (sin hospital seleccionado)
  - Verificar coexistencia con chips ACTIVOS/DESPRIORIZADOS/RESUELTOS
  - Pedir al usuario si tiene ajustes antes de la fase de accesibilidad

- [x] 12. Completar atributos de accesibilidad
  - [x] 12.1 Revisar y completar los atributos `aria-label` en todos los controles interactivos del modal que no los tengan aún: botones de tabs, botones de preset, botones de navegación del calendario (anterior/siguiente mes), celdas de día del calendario, checkboxes de tipo/escalafón/estado, input de puesto, botones del footer del modal, botón del banner
    - Cada `aria-label` debe identificar el propósito del elemento sin requerir contexto visual (ej: `aria-label="Filtrar por bimestre"`, `aria-label="Mes anterior"`, `aria-label="Día 15 de junio de 2026"`)
    - _Requirements: 10.7_

- [ ]* 13. Escribir tests de propiedades para las funciones de filtrado
  - [ ]* 13.1 Escribir test de propiedad: `parsearFecha("-")` y `parsearFecha("")` y `parsearFecha(null)` siempre retornan `null`
    - **Propiedad: parsearFecha devuelve null para valores sin fecha**
    - **Validates: Requirements 3.9**
  - [ ]* 13.2 Escribir test de propiedad: para cualquier fecha válida `f` donde `fechaDesde ≤ f ≤ fechaHasta`, `pedidoPasaFiltroFechas({ fecha: f.toISOString() }, fechaDesde, fechaHasta)` retorna `true`
    - **Propiedad: solapamiento garantiza inclusión en filtro de fechas**
    - **Validates: Requirements 3.10**
  - [ ]* 13.3 Escribir test de propiedad: con `filtrosBusqueda = { activo: false, ... }`, `pedidoPasaTodosLosFiltros(pedido)` retorna `true` para cualquier pedido
    - **Propiedad: filtro inactivo no excluye ningún pedido**
    - **Validates: Requirements 7.4**
  - [ ]* 13.4 Escribir test de propiedad: con todos los arrays vacíos, texto de puesto vacío, y todos los flags de estado en `false`, `pedidoPasaTodosLosFiltros(pedido)` retorna `true` para cualquier pedido
    - **Propiedad: filtro activo sin criterios configurados es equivalente a sin restricción**
    - **Validates: Requirements 4.4, 5.5, 6.8**

  > Implementar los tests como funciones `testPBT_*` ejecutables desde la consola del navegador (inline en `OBRAS v9.html`), sin librerías externas. Cada función genera N casos aleatorios, evalúa la propiedad, y registra los resultados en `console.log`.

- [x] 14. Checkpoint final — Prueba end-to-end
  - Asegurar que todos los tests de propiedades pasen
  - Verificar que no haya regresiones en funcionalidades existentes (creación de pedidos, chips de estado, copia de info, etc.)
  - Pedir al usuario si hay ajustes finales antes de cerrar la tarea

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Toda la implementación va dentro del archivo único `OBRAS v9.html` — no se crean archivos nuevos
- La paleta de colores es fija: `#153244` (primario), `#8de2d6` (secundario), `#ffcc00` (terciario)
- El filtro avanzado nunca muta `datosSheets`; opera siempre en modo lectura
- El hook en `entrarHospital()` es una sola línea: los filtros de estado existentes tienen precedencia
- Los tests de propiedades (tarea 13) se implementan como funciones vanilla ejecutables en consola del navegador

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["2.6", "3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 6, "tasks": ["6.6", "8.1", "8.2"] },
    { "id": 7, "tasks": ["8.3", "8.4"] },
    { "id": 8, "tasks": ["9.1", "9.2", "10.1", "10.2"] },
    { "id": 9, "tasks": ["10.3", "10.4"] },
    { "id": 10, "tasks": ["12.1"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3", "13.4"] }
  ]
}
```
