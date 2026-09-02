# Implementation Plan: Conexión Google Sheets

## Overview

Este plan implementa la conexión de `OBRAS v9.html` a un Google Sheet real en dos entregables:

- **(A) Apps Script** — código nuevo (`getHoja2026_`, `esVerdadero_`, `jsonOut_`, `doGet`, `doPost`, `crearFilas_`, y opcionalmente `actualizarFilas`) que se pega en el editor de Apps Script del documento y se publica como Web App `/exec`.
- **(B) Frontend** — cambio **mínimo** en `OBRAS v9.html`: reemplazar el cuerpo no-op de `persistirPedidoBackend(hospital, pedido)` por la versión `async` con POST. La lectura (`obtenerDatos`, `normalizarPayload`) y el manejo de error de lectura con fallback a `DB_ARRAY_LOCAL` (`iniciarApp`) **ya existen** y no se reconstruyen — solo se verifican.

El contrato de datos es inmutable (Contrato_Cargo posicional de 10 elementos) y las firmas de integración se preservan.

### Notas de entorno (leer antes de las tareas de testing)

- El proyecto es un **HTML único** abierto directamente en Chrome. **No hay Node ni framework de test instalado**, y **no hay build**.
- La verificación funcional real se hace **abriendo `OBRAS v9.html` en Chrome y probando manualmente** (crear pedido, ver cards).
- Las tareas de **property-based testing (PBT)** requieren portar las funciones puras de transformación a un archivo `.js` de test y correrlas con un runtime JS (Node + fast-check). Estas tareas están marcadas como **opcionales (`*`)** y como **setup-dependientes**, porque dependen de instalar herramientas que hoy no están presentes en el entorno. Si no hay runtime disponible, se saltean sin bloquear el entregable.
- Las funciones de Apps Script (`doGet`/`doPost`/`crearFilas_`/etc.) para PBT deben portarse a JS con un **mock del Sheet** (matriz en memoria con `getValues`/`appendRow` simulados), ya que `SpreadsheetApp` no existe fuera de Google.

### Etiqueta de property test (del diseño)

Cada property test se anota con:
`// Feature: conexion-google-sheets, Property {N}: {texto de la property}`
Mínimo **100 iteraciones** por property.

## Tasks

- [x] 1. Preparar el archivo del Apps Script (Entregable A)
  - [x] 1.1 Crear el archivo fuente del Apps Script con helpers de acceso y salida
    - Crear un archivo nuevo `.kiro/specs/conexion-google-sheets/apps-script.gs` (código para pegar en el editor de Apps Script del documento).
    - Implementar `getHoja2026_()`: `SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2026")`; si es `null`, lanzar `Error('No se encontró la pestaña "2026" en el documento.')`. TODAS las operaciones pasan por este helper.
    - Implementar `esVerdadero_(v)`: `true` si `v === true` o si `String(v).trim().toLowerCase() === "true"`.
    - Implementar `jsonOut_(obj)`: `ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)`.
    - _Requirements: 2.3, 4.5, 7.2_

- [x] 2. Implementar la lectura del backend (`doGet`)
  - [x] 2.1 Implementar `doGet(e)` con lectura, agrupación y mapeo posicional
    - Envolver todo el cuerpo en `try/catch`; el `catch` devuelve `jsonOut_({ ok:false, error: String(err.message || err) })` (nunca HTML de error).
    - `var hoja = getHoja2026_();` y `var filas = hoja.getDataRange().getValues();`.
    - Iterar desde `i = 2` (fila 3; filas 1 y 2 son encabezados). Saltear filas con col A (`f[0]`) vacía o `null`.
    - Calcular `prioridad = (String(f[6]).toLowerCase() === "despriorizado") ? "DESPRIORIZADO" : "-"`.
    - Calcular `validado = esVerdadero_(f[13]) ? 1 : 0` (col N) y `resuelto = esVerdadero_(f[18]) ? 1 : 0` (col S).
    - Armar el cargo posicional `[f[7], f[8], f[9], f[10], f[11], f[15], f[16], f[17], validado, resuelto]` = `[tipoQ, escalafon, puesto, qPlan, canal, qPedido, expediente, qAprobado, validado, resuelto]`.
    - Agrupar por clave `hospital + "||" + detalle + "||" + tipo + "||" + fecha` (A+C+B+D). El Pedido es el array posicional `[tipo, detalle, fecha, prioridad, []]`; el hospital se usa como clave tal cual, sin normalizar.
    - Devolver `jsonOut_({ hospitales: hospitales })` (sin `grupos`/`catalogos` en esta versión).
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 6.1, 6.2, 6.3_

  - [ ]* 2.2 Escribir property test — Round-trip de lectura preserva los cargos
    - **Property 1: Round-trip de lectura preserva los cargos**
    - **Validates: Requirements 2.4, 2.6, 2.7, 2.10, 6.1, 6.2, 6.4**
    - Portar `doGet` + `normalizarPayload` a JS con mock del Sheet (matriz en memoria). Generar matriz de filas válida → `doGet` → `normalizarPayload`; verificar que cada cargo coincide campo a campo en el orden posicional. Mín. 100 iteraciones. Requiere setup de entorno de test JS (opcional si no hay runtime).

  - [ ]* 2.3 Escribir property test — Agrupación por clave compuesta
    - **Property 2: Agrupación por clave compuesta**
    - **Validates: Requirements 2.5**
    - Generar filas con claves A+C+B+D repetidas/distintas; verificar que dos filas quedan en el mismo Pedido si y solo si comparten las cuatro claves. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

  - [ ]* 2.4 Escribir property test — Regla de prioridad
    - **Property 3: Regla de prioridad**
    - **Validates: Requirements 2.8**
    - Generar strings arbitrarios para col G; verificar que `prioridad === "DESPRIORIZADO"` sii `toLowerCase() === "despriorizado"`, si no `"-"`. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

  - [ ]* 2.5 Escribir property test — El nombre del hospital no se normaliza (lectura)
    - **Property 4: El nombre del hospital no se normaliza**
    - **Validates: Requirements 2.9, 4.6**
    - Nombres con sufijos/espacios/unicode; verificar que la clave en el Payload_Lectura es idéntica byte a byte a col A. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

- [x] 3. Implementar la escritura del backend (`doPost` + `crearFilas_`)
  - [x] 3.1 Implementar `crearFilas_(hospital, pedido)`
    - `var hoja = getHoja2026_();`.
    - `prioriG = (pedido.prioridad === "DESPRIORIZADO") ? "despriorizado" : "";`.
    - Por cada cargo en `pedido.cargos`, hacer `hoja.appendRow([...])` con el orden A..X del diseño: A=`hospital` (sin normalizar), B=`pedido.tipo`, C=`pedido.detalle`, D=`pedido.fecha`, E=`""`, F=`""`, G=`prioriG`, H=`c.tipoQ`, I=`c.escalafon`, J=`c.puesto`, K=`c.qPlan`, L=`c.canal`, M=`false`, N=`c.validado` (bool), O=`""`, P=`c.qPedido`, Q=`c.expediente`, R=`c.qAprobado`, S=`c.resuelto` (bool), T..X=`""`.
    - Devolver `cargos.length`.
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 3.2 Implementar `doPost(e)` con ruteo por acción
    - Envolver en `try/catch`; el `catch` devuelve `jsonOut_({ ok:false, error: String(err.message || err) })` (nunca HTML de error).
    - `var body = JSON.parse(e.postData.contents);` (body llega como `text/plain`).
    - Si `body.accion === "crear"`: `var filas = crearFilas_(body.hospital, body.pedido);` y devolver `jsonOut_({ ok:true, filas:filas })`.
    - Acción no reconocida: `jsonOut_({ ok:false, error:"Acción no reconocida: " + accion })`.
    - (El ruteo de `"actualizar"` se agrega en la tarea opcional 7.2.)
    - _Requirements: 4.5, 4.8_

  - [ ]* 3.3 Escribir property test — Una fila por cada cargo
    - **Property 5: Una fila por cada cargo (relación de conteo)**
    - **Validates: Requirements 4.5**
    - Portar `crearFilas_` a JS con mock del Sheet que cuenta `appendRow`; verificar que produce exactamente `pedido.cargos.length` filas. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

  - [ ]* 3.4 Escribir property test — Round-trip escritura→lectura preserva el pedido
    - **Property 6: Round-trip escritura→lectura preserva el pedido**
    - **Validates: Requirements 4.7, 6.2**
    - `doPost({accion:"crear"})` sobre mock del Sheet → `doGet`; verificar que `tipo`, `detalle`, `fecha`, `prioridad` y cada campo de cada cargo (incluyendo `validado`/`resuelto`) coinciden con el pedido enviado. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

- [x] 4. Checkpoint — Backend (Apps Script) completo
  - Ensure all tests pass, ask the user if questions arise.
  - Revisar que `getHoja2026_`, `esVerdadero_`, `jsonOut_`, `doGet`, `doPost` y `crearFilas_` estén en el archivo `.gs` y sean coherentes con el mapeo de columnas del diseño.

- [x] 5. Implementar el POST asíncrono en el Frontend (Entregable B)
  - [x] 5.1 Reemplazar el cuerpo no-op de `persistirPedidoBackend(hospital, pedido)` en `OBRAS v9.html`
    - Convertir la función a `async` **manteniendo la firma de 2 parámetros** (`hospital`, `pedido`).
    - Si `!GOOGLE_SHEETS_URL` → `return` (no-op silencioso).
    - `fetch(GOOGLE_SHEETS_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body: JSON.stringify({ accion:"crear", hospital, pedido }) })`.
    - Validar: si `!resp.ok` → `throw new Error("HTTP " + resp.status)`; parsear `data = await resp.json()`; si `!data || data.ok !== true` → `throw new Error((data && data.error) || "Respuesta inválida del Sheets")`.
    - Éxito → `console.log(...data.filas...)`. Error (en `catch`) → `alert(...)` indicando que el pedido se guardó localmente pero no se sincronizó (el pedido YA está en memoria).
    - NO tocar el llamador en `guardarNuevoPedido` (ya hace `datosSheets[hospital].push(pedido)` antes y llama sin `await`).
    - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.2 Escribir property test — El recorte de sufijo es solo visual
    - **Property 7: El recorte de sufijo es solo visual**
    - **Validates: Requirements 6.5**
    - Portar `nombreEfectorDisplay` a JS; nombres con/sin `" - PROYECTO"`; verificar que puede recortar para mostrar pero el valor original (clave/`hospital` enviado) permanece inalterado. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

  - [ ]* 5.3 Escribir unit/example tests del wiring de escritura y config
    - Con mock de `fetch`: verificar método POST, header `text/plain;charset=utf-8`, body con `accion/hospital/pedido` (R4.2/4.3/4.4); `persistirPedidoBackend.length === 2` (R4.1); URL vacía → no-op sin `fetch` (R1.2); POST ok → `console.log` de filas (R5.2); POST que falla → `alert` y pedido conservado en `datosSheets` (R5.3/5.4). Requiere setup de test JS (opcional).

- [ ] 6. Verificación de la lectura existente y wiring final (Frontend)
  - [x] 6.1 Verificar (sin reconstruir) la lectura y el fallback existentes
    - Confirmar que `obtenerDatos()` hace GET a `GOOGLE_SHEETS_URL` (o devuelve `DB_ARRAY_LOCAL` si está vacía) y lanza en HTTP no exitoso.
    - Confirmar que `normalizarPayload()` consume el formato posicional del Contrato_Cargo y convierte `validado`/`resuelto` a booleanos (`c[8] === 1`).
    - Confirmar que `iniciarApp()` tiene `try/catch` con `alert` de error de lectura y fallback a `normalizarPayload(DB_ARRAY_LOCAL)`.
    - No modificar estas funciones; solo dejar constancia de que cumplen R2.1, R2.10, R3.1, R3.2, R6.4.
    - _Requirements: 2.1, 2.10, 3.1, 3.2, 6.4_

  - [~] 6.2 Configurar la URL del Web App (TAREA MANUAL / CONFIG — la ejecuta el usuario)
    - Publicar el Apps Script: Extensiones > Apps Script > pegar el código del archivo `.gs` > Implementar > Nueva implementación > Aplicación web (Ejecutar como: yo; Acceso: cualquiera) > copiar la URL `/exec`.
    - Pegar esa URL en la constante `GOOGLE_SHEETS_URL` de `OBRAS v9.html`.
    - _Requirements: 1.1, 1.3_

  - [ ]* 6.3 Integration / Smoke tests del Apps Script
    - SMOKE: verificar que se usa `getSheetByName("2026")` y que `null` produce error JSON claro (R2.2/2.3).
    - INTEGRATION: hoja de ejemplo con encabezados reales; verificar que la lectura arranca en la fila 3 y saltea los 2 encabezados (R2.2).
    - Escritura end-to-end: ejecutar `doPost(crear)` contra una hoja de prueba y verificar 1–3 filas resultantes (ejemplos, no PBT). Requiere ejecución en el entorno de Apps Script (opcional).

- [ ] 7. (OPCIONAL — Extensión futura R7) Actualización de celdas editables
  - [ ]* 7.1 Implementar `actualizarFilas(...)` en el Apps Script
    - Ubicar la fila por HOSPITAL(A) + DENOMINACION(C) + ESCALAFON(I) + PUESTO(J) más el índice del cargo dentro del grupo (iterar desde `i=2`, contando `vistos`).
    - Modificar **solo** columnas editables 1-based: N=14, P=16, R=18, S=19, usando `hoja.getRange(fila1based, col).setValue(...)` según `campos.validado/qPedido/qAprobado/resuelto`.
    - Devolver `true` si actualizó, `false` si no encontró la fila.
    - _Requirements: 7.2_

  - [ ]* 7.2 Cablear la acción "actualizar" en `doPost`
    - Agregar rama `if (accion === "actualizar")` que llame a `actualizarFilas(body.hospital, body.denominacion, body.escalafon, body.puesto, body.idxCargo, body.campos)` y devuelva `jsonOut_({ ok:true, actualizado:r })`.
    - _Requirements: 7.2_

  - [ ]* 7.3 Implementar el gancho `actualizarCargoBackend(...)` en el Frontend y cablearlo
    - POST async (mismo patrón que `persistirPedidoBackend`: header `text/plain`, body `{ accion:"actualizar", ... }`), con `alert` de error que mantiene la app operable.
    - Cablear en `interactuarCheckCargo` y en los inputs de Q PEDIDO / Q APROBADO.
    - _Requirements: 7.1, 7.3_

  - [ ]* 7.4 Escribir property test — La actualización solo toca N, P, R, S
    - **Property 8: La actualización solo toca N, P, R, S**
    - **Validates: Requirements 7.1, 7.2**
    - Portar `actualizarFilas` a JS con mock del Sheet; verificar que solo cambian N/P/R/S de la fila objetivo y todo lo demás queda intacto. Mín. 100 iteraciones. Requiere setup de test JS (opcional).

- [~] 8. Checkpoint final — Entregables listos
  - Ensure all tests pass, ask the user if questions arise.
  - Confirmar que el archivo `.gs` (Entregable A) está completo y que `OBRAS v9.html` (Entregable B) tiene el `persistirPedidoBackend` con POST y el resto intacto.

## Notes

- Las tareas marcadas con `*` son opcionales. En este proyecto incluyen **todas las de testing**, porque dependen de instalar un runtime/framework JS que hoy no está presente (no hay Node ni build). Se pueden saltear sin bloquear los entregables.
- La verificación funcional definitiva es **manual**: abrir `OBRAS v9.html` en Chrome, crear un pedido y observar las cards. No hay build ni test runner automático en el entorno.
- La lectura (`obtenerDatos`, `normalizarPayload`) y el manejo de error de lectura con fallback (`iniciarApp`) **ya existen**; solo se verifican (tarea 6.1), no se reconstruyen.
- El cambio de Frontend es **mínimo y aislado**: solo el cuerpo de `persistirPedidoBackend`. El llamador en `guardarNuevoPedido` no cambia.
- La tarea 6.2 es **manual/config** (la ejecuta el usuario): pegar la URL `/exec` en `GOOGLE_SHEETS_URL`.
- Cada tarea referencia sus requirements; cada property test referencia su property numerada del diseño.
- El contrato de datos (Contrato_Cargo posicional de 10) y las firmas de integración se preservan sin cambios.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3"] },
    { "id": 6, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.3", "3.4", "5.2", "5.3", "6.2", "6.3", "7.4"] }
  ]
}
```
