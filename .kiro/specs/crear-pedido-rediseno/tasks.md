# Implementation Plan: Rediseño del Modal CREAR PEDIDO

## Overview

Implementación del rediseño del modal "CREAR PEDIDO" (`#modal-creacion`) dentro del archivo único `OBRAS v9.html` (JavaScript vanilla, sin dependencias, todo inline). La feature transforma el modal actual (una sola línea de cargo en layout vertical, con `guardarNuevoPedido()` placeholder) en un formulario con cabecera vertical compartida y un Detalle de RRHH con líneas de cargo horizontales, multi-línea, cada una independiente y eliminable (siempre ≥ 1). Incorpora la regla escalafón→puesto (`MAPA_ESCALAFON_PUESTO`) y reescribe el guardado para persistir el pedido en `datosSheets` (solo en memoria).

El orden de las tareas sigue la construcción incremental: primero los datos y funciones puras, luego el CSS, luego el markup, luego las funciones de líneas dinámicas, la regla escalafón→puesto, el reset/apertura, el guardado, la limpieza de código obsoleto, los checkpoints de verificación en navegador y, por último, los tests de propiedades opcionales.

---

## Tasks

- [x] 1. Inyectar datos y funciones puras base
  - [x] 1.1 Inyectar la constante global `MAPA_ESCALAFON_PUESTO` en `OBRAS v9.html`
    - Copiar el contenido de `esc_puesto.json` del workspace como constante JS inline `const MAPA_ESCALAFON_PUESTO = { ... }` en el bloque de datos/estado global, junto a `catalogos` y `datosSheets`
    - Formato `{ [escalafon: string]: string[] }`; escalafones con puestos: ENFERMERIA(2), CETPS(28), CPH MEDICO GUARDIA(85), CPH NO MEDICO GUARDIA(48), CPH MEDICO PLANTA(85), CPH NO MEDICO PLANTA(48), ESCALAFON GRAL.(95), SERVICIOS GRALES. ANEXO II(7); escalafones con lista vacía: LOYS, PLANTA DE GABINETE, GERENTE OPERATIVO, SUBGERENTE OPERATIVO, JEFE DE DEPARTAMENTO, JEFE DE DIVISION, JEFE DE SECCION, JEFE DE UNIDAD
    - _Requirements: 6.1, 6.6, 6.7_
  - [x] 1.2 Implementar las funciones puras `puestosDeEscalafon`, `esPuestoTextoLibre` y `clamp`
    - `puestosDeEscalafon(escalafon)`: devuelve `MAPA_ESCALAFON_PUESTO[escalafon]` si es clave del mapa; en caso contrario devuelve `[]` (fallback seguro para escalafón no mapeado)
    - `esPuestoTextoLibre(escalafon)`: devuelve `puestosDeEscalafon(escalafon).length === 0`
    - `clamp(n, min, max)`: normaliza `n` (si no es entero válido → `1`) y lo acota a `[min, max]`; se usará como `clamp(cantidad, 1, 10)`
    - Estas funciones NO deben leer del DOM (lógica pura, testeable de forma aislada)
    - Declarar el estado de módulo `let contadorLineasRRHH = 0;` junto a las variables globales
    - _Requirements: 6.1, 6.2, 6.3, 4.3_
  - [ ]* 1.3 Escribir test de propiedad para la integridad del mapa escalafón→puesto
    - **Property 3: Integridad del mapa escalafón→puesto**
    - **Validates: Requirements 6.6, 6.7**
    - fast-check en entorno separado; verificar longitudes exactas por escalafón y listas vacías; sin agregar dependencias a `OBRAS v9.html`
  - [ ]* 1.4 Escribir test de propiedad para la regla puesto según escalafón (nivel lógica pura)
    - **Property 1: Puesto según escalafón** (parte de datos: `puestosDeEscalafon`/`esPuestoTextoLibre`)
    - **Validates: Requirements 6.2, 6.3**
    - Generar escalafones con puestos y ausentes/vacíos; verificar `puestosDeEscalafon(esc)` == `MAPA_ESCALAFON_PUESTO[esc]` (o `[]`) y `esPuestoTextoLibre` acorde

- [x] 2. Agregar los estilos CSS del rediseño
  - [x] 2.1 Agregar al `<style>` de `OBRAS v9.html` los estilos del modal ampliado y la barra de agregar línea
    - `.cajon-creacion { width: 720px; max-width: 95vw; }` (sin afectar los `.cajon-pedido` de la grilla)
    - `.barra-agregar-linea` (flex, gap, margin-top), `.barra-agregar-linea #nuevo-cantidad-lineas { flex: 0 0 60px; }`, `.barra-agregar-linea .btn-agregar-fila { flex: 1; }`
    - _Requirements: 4.1, 4.2, 11.2, 11.3_
  - [x] 2.2 Agregar los estilos de la línea de RRHH y su layout horizontal
    - `.linea-rrhh` (borde, radius, padding, margin, fondo `var(--gris-claro)`)
    - `.linea-rrhh-fila`: `display: grid; grid-template-columns: 1fr 1.3fr 1.5fr 0.7fr 0.7fr 0.7fr; gap: 8px; align-items: end;` (tipoQ, escalafón, puesto, qPlan, qPedido, qAprob)
    - `.linea-rrhh-secundaria` (flex), `.campo-rrhh` (flex column), `.campo-rrhh label` (font-size 10px, bold, color #555), `.campo-canal`/`.campo-expediente { flex: 2; }`, `.campo-rrhh .input-creacion { margin: 0; }`
    - `.btn-eliminar-linea` con paleta del contrato y fuente Montserrat, más su estado `:hover`
    - _Requirements: 2.2, 2.3, 2.7, 5.1, 11.2, 11.3_
  - [x] 2.3 Agregar la media query `max-width: 768px` para la vista compacta
    - `.cajon-creacion { width: 100%; max-width: 100%; padding: 15px; }`
    - `.linea-rrhh-fila { grid-template-columns: 1fr 1fr; }` (2 columnas, sin desborde horizontal)
    - `.linea-rrhh-secundaria { flex-wrap: wrap; }`
    - _Requirements: 3.1, 3.2_

- [x] 3. Reemplazar el markup estático del Detalle de RRHH
  - [x] 3.1 Agregar la clase `cajon-creacion` al `.cajon-pedido` de `#modal-creacion` y conservar la cabecera vertical con sus ids fijos
    - Mantener los ids fijos de cabecera: `#nuevo-hospital`, `#nuevo-tipo`, `#nuevo-denominacion`, `#nuevo-fecha`, `#nuevo-es-despriorizado` (checkbox inicial no marcado)
    - Verificar aria-labels de los campos de cabecera
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 11.2_
  - [x] 3.2 Reemplazar el markup estático de una sola línea (ids `#nuevo-tipoq`, `#nuevo-escalafon`, `#nuevo-puesto`, `#nuevo-qplan`, `#nuevo-canal`, `#nuevo-qpedido`, `#nuevo-expediente`, `#nuevo-qaprobado`) por el contenedor dinámico y la barra de agregar
    - Insertar `<div id="contenedor-lineas-rrhh"></div>` dentro de `.seccion-cargos`
    - Insertar la `.barra-agregar-linea` con `<input type="number" id="nuevo-cantidad-lineas" class="input-num" min="1" max="10" value="1" step="1" onfocus="this.select()" aria-label="Cantidad de líneas a agregar (1 a 10)">` y el botón `+ AGREGAR LÍNEA DE PEDIDO` con `onclick="agregarLineasRRHH(parseInt(document.getElementById('nuevo-cantidad-lineas').value, 10))"` y `aria-label="Agregar línea de pedido"`
    - Eliminar del DOM los ids fijos de línea única obsoletos
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 12.1, 12.2_

- [x] 4. Implementar las funciones de líneas dinámicas
  - [x] 4.1 Implementar `crearHtmlLineaRRHH(idLinea)`
    - Devuelve el HTML de una `.linea-rrhh` con `data-id-linea="${idLinea}"`, fila principal horizontal (Tipo de Q, Escalafón, Puesto Nuevo, Q Plan, Q Pedido, Q Aprob.) y renglón secundario (Canal, Expediente, botón eliminar)
    - Todos los controles con ids sufijados `-${idLinea}`; campos numéricos con `value="0"` y `onfocus="this.select()"`; campos de texto vacíos
    - Puesto se inicializa como `<input type="text">` (texto libre); el `<select>` de escalafón incluye `onchange="onCambioEscalafon(${idLinea})"`; botón eliminar con `onclick="eliminarLineaRRHH(${idLinea})"`
    - Aria-labels en cada control por línea (incluye `aria-label="Eliminar línea ${idLinea}"`)
    - _Requirements: 2.2, 2.3, 2.6, 2.7, 4.5, 4.6, 5.1, 12.3, 12.4_
  - [x] 4.2 Implementar `poblarSelectsLineaRRHH(idLinea)`
    - Poblar `#nuevo-tipoq-${idLinea}` con `catalogos.tiposQ` y `#nuevo-escalafon-${idLinea}` con `catalogos.escalafones`, reutilizando `poblarSelect`
    - _Requirements: 2.4, 2.5_
  - [x] 4.3 Implementar `agregarLineasRRHH(cantidad)`
    - Acotar con `clamp(cantidad, 1, 10)`; por cada línea: incrementar `contadorLineasRRHH`, appender `crearHtmlLineaRRHH(id)` a `#contenedor-lineas-rrhh` con `insertAdjacentHTML('beforeend', ...)`, y llamar a `poblarSelectsLineaRRHH(id)`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_
  - [x] 4.4 Implementar `eliminarLineaRRHH(idLinea)`
    - Si hay ≤ 1 línea en `#contenedor-lineas-rrhh`, no hacer nada (conservar al menos una); de lo contrario quitar la `.linea-rrhh[data-id-linea="${idLinea}"]` del DOM
    - _Requirements: 5.2, 5.3, 5.4_
  - [ ]* 4.5 Escribir test de propiedad para el agregado clampado de líneas
    - **Property 4: Agregado clampado de líneas**
    - **Validates: Requirements 4.3, 4.4**
    - Modelo abstracto: para cualquier entero `n`, el conteo crece exactamente `clamp(n,1,10)`
  - [ ]* 4.6 Escribir test de propiedad para el invariante de al menos una línea
    - **Property 5: Invariante de al menos una línea**
    - **Validates: Requirements 5.2, 5.3, 5.4**
    - Modelo abstracto con secuencia aleatoria de add/remove; conteo siempre ≥ 1 y remove correcto salvo cuando es la única

- [x] 5. Implementar la regla escalafón→puesto en el DOM
  - [x] 5.1 Implementar `onCambioEscalafon(idLinea)`
    - Leer el escalafón de `#nuevo-escalafon-${idLinea}`, obtener `puestosDeEscalafon(esc)` y reconstruir el nodo del campo Puesto en `#contenedor-puesto-${idLinea}`
    - Con puestos definidos: `<select>` limitado a esos puestos (option placeholder deshabilitado + un option por puesto); sin puestos / no mapeado: `<input type="text">` texto libre
    - Mantener id estable `#nuevo-puesto-${idLinea}` y aria-label; al reconstruir el nodo el valor previo se pierde (reset garantizado); escapar comillas en atributos por precaución
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  - [ ]* 5.2 Escribir test de propiedad para el reset del puesto al cambiar escalafón
    - **Property 2: Cambiar escalafón resetea el puesto**
    - **Validates: Requirements 6.4**
    - Para cualquier valor previo de Puesto, tras `onCambioEscalafon` el valor queda vacío
  - [ ]* 5.3 Escribir test de propiedad para la presentación del Puesto según escalafón (nivel DOM)
    - **Property 1: Puesto según escalafón**
    - **Validates: Requirements 6.2, 6.3**
    - Con puestos → select cuyas opciones == lista válida; sin puestos/no mapeado → input texto libre

- [x] 6. Implementar el reset y la apertura del modal
  - [x] 6.1 Implementar `resetearModalCreacion()`
    - Limpiar cabecera: `#nuevo-hospital`/`#nuevo-tipo` a `selectedIndex = 0`, `#nuevo-denominacion`/`#nuevo-fecha` a `""`, `#nuevo-es-despriorizado.checked = false`, `#nuevo-cantidad-lineas.value = 1`
    - Vaciar `#contenedor-lineas-rrhh`, resetear `contadorLineasRRHH = 0` y llamar a `agregarLineasRRHH(1)` (queda exactamente 1 línea limpia)
    - _Requirements: 1.6, 5.4, 4.6_
  - [x] 6.2 Modificar `abrirModalCreacion()`
    - Llamar a `resetearModalCreacion()` antes de agregar la clase `abierto` al `#modal-creacion`, de modo que el modal abra siempre en estado limpio con 1 línea de RRHH
    - _Requirements: 1.1, 1.7, 5.4_

- [x] 7. Checkpoint — Verificar layout, líneas dinámicas y regla escalafón→puesto en el navegador
  - Abrir el modal y verificar: cabecera vertical, layout horizontal >768px y apilado ≤768px, agregar N líneas (1 a 10), eliminar líneas manteniendo ≥ 1, y que al elegir escalafón el Puesto cambie entre select filtrado y texto libre reseteando su valor
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar la lectura y el guardado del pedido
  - [x] 8.1 Implementar `leerLineaRRHH(idLinea)`
    - Leer los inputs de la línea y devolver el objeto `cargo` con `tipoQ`, `escalafon`, `puesto`, `qPlan`, `canal`, `qPedido`, `expediente`, `qAprobado`, `validado: false`, `resuelto: false`
    - Parseo numérico: `parseInt(value, 10)`; si `NaN` → `0` para `qPlan`/`qPedido`/`qAprobado`
    - El nodo Puesto puede ser select o input; leer su `.value` de forma indistinta
    - _Requirements: 8.3, 10.3_
  - [x] 8.2 Implementar `persistirPedidoBackend(hospital, pedido)` (stub)
    - No-op documentado: punto de integración con backend a futuro; actualmente la persistencia es solo en memoria
    - _Requirements: 8.7, 9.1, 9.2_
  - [x] 8.3 Reescribir `guardarNuevoPedido()`
    - Leer cabecera (`hospital`, `tipo`, `denominacion` trim, `fecha` string tal cual, `despri`) y acumular faltantes obligatorios: Hospital, Tipo de Pedido, Denominación
    - Recorrer todas las `.linea-rrhh`; por cada una `leerLineaRRHH(id)`, acumular faltantes de Escalafón y Puesto (con número de línea visual), y agregar el cargo a `cargos`
    - Si hay faltantes: `alert` con la lista y cancelar (sin modificar `datosSheets`)
    - Si válido: armar `pedido = { tipo, detalle: denominacion, fecha, prioridad: despri ? "DESPRIORIZADO" : "-", cargos }`, crear `datosSheets[hospital]` si no existe, `push` del pedido, llamar a `persistirPedidoBackend(hospital, pedido)`, `cerrarModalCreacion()` y `entrarHospital(hospital)`
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.3_
  - [ ]* 8.4 Escribir test de propiedad para la independencia de valores entre líneas
    - **Property 6: Independencia de valores entre líneas**
    - **Validates: Requirements 4.7, 6.5**
    - N líneas con valores random distintos; leer cada una devuelve sus propios valores (sobre la lógica pura extraída del lector)
  - [ ]* 8.5 Escribir test de propiedad para el armado y forma del pedido y del cargo
    - **Property 7: Armado y forma del pedido y del cargo**
    - **Validates: Requirements 4.5, 8.2, 8.3, 8.4, 10.3**
    - Round-trip valores → `pedido`/`cargo`: campos presentes, `prioridad` correcta, defaults `validado`/`resuelto` en false, numéricos parseados (0 si vacío/no numérico)
  - [ ]* 8.6 Escribir test de propiedad para el guardado condicionado a obligatorios
    - **Property 8: Guardado condicionado a campos obligatorios**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Persiste sii todos los obligatorios completos; si falta alguno, no persiste y reporta faltantes
  - [ ]* 8.7 Escribir test de propiedad para la persistencia del pedido bajo el hospital
    - **Property 9: Persistencia del pedido bajo el hospital**
    - **Validates: Requirements 8.1**
    - Tras guardar un pedido válido, `datosSheets[hospital]` lo contiene, creando la clave si no existía

- [x] 9. Limpiar el poblado obsoleto de selects de línea única
  - [x] 9.1 Eliminar de `iniciarApp()` el poblado de los selects de línea única obsoletos
    - Quitar `poblarSelect('nuevo-tipoq', ...)`, `poblarSelect('nuevo-escalafon', ...)` y `poblarSelect('nuevo-puesto', ...)` (ahora los selects se pueblan por línea vía `poblarSelectsLineaRRHH`)
    - Conservar `poblarSelect('nuevo-tipo', catalogos.tiposPedido)` (cabecera) e `inicializarHospitales()`
    - _Requirements: 1.2, 1.3, 10.2_

- [x] 10. Checkpoint — Verificar guardado y no regresión en el navegador
  - Verificar: validación de obligatorios (alert con faltantes), guardado de un pedido válido que aparece al entrar al hospital, cierre del modal al guardar, cierre al hacer clic afuera, y que chips de estado / búsqueda avanzada / navegación de hospitales sigan operativas
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Las tareas marcadas con `*` son opcionales: son los tests de propiedades (fast-check) que se ejecutan en un entorno de test separado (runner tipo Jest/Vitest). NO se agregan dependencias a `OBRAS v9.html`.
- Toda la implementación de producción va dentro del archivo único `OBRAS v9.html` — no se crean archivos nuevos ni se agregan librerías (Req 11.1).
- La lógica pura (`puestosDeEscalafon`, `esPuestoTextoLibre`, `clamp`, armado de `cargo`/`pedido` a partir de un objeto plano de valores, modelo abstracto de líneas) debe ser extraíble/testeable sin leer el DOM directamente.
- Cada test de propiedad usa mínimo 100 iteraciones y se etiqueta con `// Feature: crear-pedido-rediseno, Property N: <texto>`.
- La paleta es fija: `#153244` (principal), `#8de2d6` (secundario), `#ffcc00` (terciario), fuente Montserrat (Req 11.2, 11.3).
- La persistencia es solo en memoria de la sesión; `persistirPedidoBackend` queda como único punto de integración con backend a futuro (Req 8.7, 9.1, 9.2).
- Los criterios de layout, responsive, estilo, accesibilidad y no regresión se validan por verificación manual en navegador (checkpoints 7 y 10).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["1.3", "1.4", "3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5", "4.6", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 7, "tasks": ["6.2", "8.1", "8.2"] },
    { "id": 8, "tasks": ["8.3", "9.1"] },
    { "id": 9, "tasks": ["8.4", "8.5", "8.6", "8.7"] }
  ]
}
```
