# Implementation Plan: Módulo CREAR PROYECTO

## Overview

Este plan convierte el diseño del módulo CREAR PROYECTO en una serie de tareas de codeo incrementales, todas dentro del archivo único `OBRAS v9.html` (JavaScript vanilla inline, CSS `<style>`, sin librerías, sin build, sin archivos nuevos). El orden respeta la construcción incremental del diseño: primero se generalizan de forma compatible hacia atrás las funciones de línea compartidas y se elimina el reseteo del contador de ids (decisión clave para cero regresión y cero colisión), luego CSS y markup, después la lógica de apertura/asignación/bloques, un checkpoint de UI, y finalmente lectura/guardado/persistencia con su checkpoint de regresión.

Cada tarea referencia los requisitos que cubre. Las tareas de tests de propiedad (fast-check) son opcionales, se marcan con `*`, se ejecutan en un entorno Node separado y NO agregan dependencias al HTML (Req 11.4).

## Tasks

- [x] 1. Refactor compatible hacia atrás de las funciones de línea compartidas
  - [x] 1.1 Generalizar `agregarLineasRRHH` y `eliminarLineaRRHH` a un contenedor objetivo
    - Agregar el parámetro opcional `cont` a `agregarLineasRRHH(cantidad, cont)`; si `cont` es `undefined`, resolver `document.getElementById('contenedor-lineas-rrhh')`. Mantener idéntico el resto del cuerpo (clamp 1-10, incremento de `contadorLineasRRHH`, `insertAdjacentHTML`, `poblarSelectsLineaRRHH`), de modo que la llamada inline existente `agregarLineasRRHH(parseInt(...))` siga funcionando sin cambios.
    - Agregar el parámetro opcional `cont` a `eliminarLineaRRHH(idLinea, cont)`; si no se pasa, resolver el contenedor localizando la línea por `data-id-linea` y tomando su contenedor (`.closest('.cp-lineas, #contenedor-lineas-rrhh')`). Aplicar la invariante "conservar ≥1 línea" contando las `.linea-rrhh` dentro de ese contenedor. La llamada inline existente `eliminarLineaRRHH({idLinea})` debe seguir resolviendo el contenedor por el DOM.
    - _Requirements: 4.8, 4.9, 4.10, 11.1, 11.2_

  - [x] 1.2 Eliminar el reseteo de `contadorLineasRRHH` en `resetearModalCreacion`
    - Quitar la línea `contadorLineasRRHH = 0` de `resetearModalCreacion()` para que el contador sea monótono creciente durante toda la sesión, garantizando ids `nuevo-*-{idLinea}` globalmente únicos entre CREAR PEDIDO y CREAR PROYECTO.
    - Conservar el resto del comportamiento de `resetearModalCreacion` (vaciar `#contenedor-lineas-rrhh` y crear la línea inicial vía `agregarLineasRRHH(1)`).
    - _Requirements: 4.10, 11.1, 11.2_

  - [ ]* 1.3 Test de propiedad: unicidad global de identificadores de línea
    - **Property 1: Unicidad global de identificadores de línea**
    - **Validates: Requirements 4.10, 11.2**
    - Extraer la lógica pura del contador monótono a una función testeable en entorno Node con fast-check (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 1`.

- [x] 2. Agregar el CSS del módulo dentro de `<style>`
  - [x] 2.1 Definir estilos del botón, cajón y bloques del módulo
    - Definir `.cajon-proyecto` heredando de `.cajon-creacion` y el inline/regla de adaptabilidad vertical (`max-height:95vh; overflow-y:auto`).
    - Definir `.btn-crear-proyecto { left: <offset>; }` para separarlo del botón CREAR PEDIDO sin solaparse.
    - Definir `.cp-asignar-fila`, `.cp-bloque-hospital`, `.cp-bloque-cabecera`, `.cp-bloque-titulo` usando exclusivamente variables de la paleta fija (`--azul-oscuro`, `--celeste`, `--amarillo`, grises).
    - Agregar la media query `@media (max-width:768px)` para `.cajon-proyecto { width:100%; max-width:100%; padding:15px; }` (las líneas colapsan a 2 columnas por regla heredada de `.linea-rrhh-fila`).
    - _Requirements: 1.4, 10.1, 10.2, 10.3, 10.4_

- [x] 3. Agregar el markup del módulo dentro de `<body>`
  - [x] 3.1 Botón flotante "+ CREAR PROYECTO"
    - Insertar el botón con clases `btn-crear-flotante btn-crear-proyecto`, `onclick="abrirModalProyecto()"` y `aria-label` que describa la apertura del flujo de creación de Proyecto.
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 3.2 Overlay, cajón, campo Nombre, asignación de hospital y contenedor de bloques
    - Insertar `#modal-proyecto` (`.modal-overlay`, `onclick="cerrarModalProyectoAfuera(event)"`) con el cajón `.cajon-pedido.cajon-creacion.cajon-proyecto`.
    - Incluir el título, el input `#cp-nombre` (con etiqueta visible y `aria-label`), la fila `.cp-asignar-fila` con `#cp-select-hospital` y el botón "+ ASIGNAR HOSPITAL" (`onclick="asignarHospitalProyecto()"`), el contenedor `#cp-bloques`, y el botón "GUARDAR PROYECTO" (`onclick="guardarNuevoProyecto()"`).
    - _Requirements: 1.6, 2.1, 3.1, 9.1, 9.2, 10.1, 10.2_

- [x] 4. Implementar apertura, reset y cierre del modal
  - [x] 4.1 Implementar `abrirModalProyecto`, `resetearModalProyecto`, `cerrarModalProyecto` y `cerrarModalProyectoAfuera`
    - `abrirModalProyecto()`: llama a `resetearModalProyecto()` y agrega la clase `abierto` a `#modal-proyecto` (visible en ≤1s).
    - `resetearModalProyecto()`: vacía `#cp-nombre` y `#cp-bloques`, reinicia `hospitalesAsignados = []`, repuebla `#cp-select-hospital` vía `poblarSelectHospitalesProyecto()`; NO toca `contadorLineasRRHH`.
    - `cerrarModalProyecto()`: quita la clase `abierto` sin persistir.
    - `cerrarModalProyectoAfuera(event)`: si `event.target.id === 'modal-proyecto'`, cierra el modal.
    - Declarar la variable de estado `hospitalesAsignados`.
    - _Requirements: 1.2, 1.3, 1.6, 9.1, 9.2_

- [x] 5. Implementar asignación y quita de hospitales
  - [x] 5.1 Implementar `poblarSelectHospitalesProyecto`
    - Poblar `#cp-select-hospital` con `Object.keys(datosSheets)` filtradas por `esEfectorNavegable` (excluye `EFECTORES_OCULTOS` como "200 CARGOS") y que no estén ya en `hospitalesAsignados`; incluir un placeholder "Seleccioná…".
    - _Requirements: 3.1, 3.3_

  - [x] 5.2 Implementar `asignarHospitalProyecto` y `quitarHospitalProyecto`
    - `asignarHospitalProyecto()`: si no hay hospital seleccionado, avisar "Seleccioná un hospital" sin crear bloque (3.7); si ya está en `hospitalesAsignados`, avisar "El hospital ya está asignado" preservando el bloque existente (3.4); si es válido, llamar a `crearBloqueHospital(hospital)` y repoblar el select.
    - `quitarHospitalProyecto(hospital)`: remover el `.cp-bloque-hospital` correspondiente, sacarlo de `hospitalesAsignados` y repoblar el select, sin afectar otros bloques.
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7_

  - [ ]* 5.3 Test de propiedad: no duplicación de hospital asignado
    - **Property 5: No duplicación de hospital asignado**
    - **Validates: Requirements 3.4**
    - Modelar la lógica de asignación como función pura sobre la lista `hospitalesAsignados` y validar con fast-check (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 5`.

- [x] 6. Implementar creación de bloques de hospital y agregado de líneas
  - [x] 6.1 Implementar `crearBloqueHospital`
    - Insertar en `#cp-bloques` el HTML del bloque (cabecera con título + botón quitar, contenedor `#cp-lineas-{contId}`, barra de agregado con `#cp-cantidad-{contId}` acotado 1-10 y botón "+ AGREGAR LÍNEA DE PEDIDO"), registrar `{hospital, contId}` en `hospitalesAsignados` y agregar exactamente 1 línea inicial vía `agregarLineasBloque` / `agregarLineasRRHH(1, cont)`.
    - Reutilizar `crearHtmlLineaRRHH`, `poblarSelectsLineaRRHH` y `onCambioEscalafon` sin cambios (ids únicos por contador global); poblar Tipo de Q con `catalogos.tiposQ` y Escalafón con las 16 categorías del `MAPA_ESCALAFON_PUESTO`; incluir `aria-label` en cada campo.
    - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.10, 4.11, 5.1, 5.2, 5.3, 5.4_

  - [x] 6.2 Implementar `agregarLineasBloque`
    - Wrapper que lee `#cp-cantidad-{contId}`, aplica `clampCantidad(n, 1, 10)` y delega en `agregarLineasRRHH(n, document.getElementById('cp-lineas-'+contId))`.
    - _Requirements: 4.6, 4.7_

  - [ ]* 6.3 Test de propiedad: agregado de líneas acotado por bloque
    - **Property 2: Agregado de líneas acotado por bloque**
    - **Validates: Requirements 4.7, 4.6**
    - Validar con fast-check que `agregarLineasBloque` agrega `clampCantidad(k, 1, 10)` líneas sin afectar otros bloques (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 2`.

  - [ ]* 6.4 Test de propiedad: invariante de al menos una línea por bloque
    - **Property 3: Invariante de al menos una línea por bloque**
    - **Validates: Requirements 4.9**
    - Validar con fast-check que tras cualquier secuencia de eliminaciones el conteo del bloque nunca baja de 1 (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 3`.

  - [ ]* 6.5 Test de propiedad: independencia entre bloques
    - **Property 4: Independencia entre bloques**
    - **Validates: Requirements 3.6, 4.8, 3.5**
    - Validar con fast-check que operaciones sobre un bloque no alteran cantidad ni valores de otro (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 4`.

- [x] 7. Checkpoint - Verificación manual de UI, líneas y regla Escalafón → Puesto
  - Ensure all tests pass, ask the user if questions arise.
  - Verificar en navegador: apertura/cierre del modal (Nombre vacío, sin bloques, cierre por clic afuera); asignación de N hospitales crea N bloques y el select deja de ofrecer los asignados; duplicado y sin selección avisan; cada bloque inicia con 1 línea; clamp 1-10 al agregar; invariante ≥1 al eliminar; cambio de escalafón reconstruye Puesto (selector filtrado o texto libre) sin afectar otros bloques (Req 1.2, 1.3, 1.6, 3.1–3.7, 4.1–4.11, 5.1–5.4, 9.1, 9.2).

- [x] 8. Implementar lectura de bloques, guardado y persistencia
  - [x] 8.1 Implementar `leerBloqueHospital`
    - Iterar las `.linea-rrhh` del contenedor del bloque, llamar `leerLineaRRHH(idLinea)` por línea y devolver `{hospital, cargos[]}`, con cada `Cargo` incluyendo `tipoQ`, `escalafon`, `puesto`, `qPlan`, `canal`, `qPedido`, `expediente`, `qAprobado`, y `validado`/`resuelto` en `false`.
    - _Requirements: 7.3, 7.4_

  - [x] 8.2 Implementar `guardarNuevoProyecto` (validación acumulada + persistencia)
    - Validar en orden y acumular faltantes: Nombre tras `trim` no vacío (agregar "Nombre del Proyecto"); al menos un hospital asignado (agregar "al menos un hospital asignado"); cada bloque con al menos una línea con Escalafón y Puesto ambos no vacíos (agregar cada faltante identificando hospital y número visual 1-based de línea). Si hay faltantes, mostrar un único `alert` con la lista completa en orden y dejar `datosSheets` sin modificar.
    - Si es válido, por cada hospital asignado construir un `Pedido` con `tipo:"Proyecto"`, `detalle:` Nombre trim, `fecha:""`, `prioridad:"-"` y `cargos` desde `leerBloqueHospital` (arreglo vacío si no hay líneas); crear la entrada en `datosSheets[hospital]` si no existe, hacer `push` del pedido e invocar `persistirPedidoBackend(hospital, pedido)`.
    - Envolver la persistencia en `try/catch`: en error mantener el modal abierto y avisar "El guardado no se completó" (9.4); en éxito llamar `cerrarModalProyecto()` (9.3) y refrescar la UI con `inicializarHospitales()` (nav + Barra_Etiquetas, sin recargar).
    - _Requirements: 2.3, 2.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 8.3, 9.3, 9.4_

  - [ ]* 8.3 Test de propiedad: guardado condicionado a datos obligatorios
    - **Property 6: Guardado condicionado a datos obligatorios**
    - **Validates: Requirements 2.4, 6.1, 6.2, 6.3, 6.5, 7.10**
    - Validar con fast-check que se persiste si y solo si Nombre no vacío, ≥1 hospital y cada bloque con ≥1 línea escalafón+puesto; en otro caso `datosSheets` intacto (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 6`.

  - [ ]* 8.4 Test de propiedad: persistencia por hospital con denominación igual al Nombre
    - **Property 7: Persistencia por hospital con denominación igual al Nombre**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9**
    - Validar con fast-check la forma del `Pedido` por hospital (`detalle`, `tipo`, `fecha`, `prioridad`, `cargos`, `validado`/`resuelto` en false) (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 7`.

  - [ ]* 8.5 Test de propiedad: detección como etiqueta al alcanzar el umbral
    - **Property 8: Detección como etiqueta al alcanzar el umbral**
    - **Validates: Requirements 8.1, 8.2**
    - Validar con fast-check que `calcularEtiquetas()` incluye `P` al alcanzar `UMBRAL_ETIQUETA` (o `ETIQUETAS_CURADAS`) y que el filtro admite exactamente los pedidos cuya denominación contiene `P` (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 8`.

  - [ ]* 8.6 Test de propiedad: ausencia de regresión en el guardado de CREAR PEDIDO
    - **Property 9: Ausencia de regresión en el guardado de CREAR PEDIDO**
    - **Validates: Requirements 11.1**
    - Validar con fast-check que `guardarNuevoPedido` produce el mismo `Pedido` que antes del refactor, sin importar cuántas líneas creó previamente CREAR PROYECTO (mínimo 100 iteraciones); etiquetar con `// Feature: crear-proyecto, Property 9`.

- [x] 9. Checkpoint - Verificación manual de guardado, persistencia y no regresión
  - Ensure all tests pass, ask the user if questions arise.
  - Verificar en navegador: guardado inválido muestra alert acumulado con `datosSheets` intacto; guardado válido crea un pedido por hospital con `detalle` = Nombre, el Proyecto aparece en la Barra_Etiquetas al alcanzar el umbral y su filtro muestra los pedidos de todos los hospitales sin recargar; CREAR PEDIDO abre, opera y guarda igual que antes; búsqueda avanzada, etiquetas y navegación intactas; adaptabilidad hasta 95vw/95vh con scroll y colapso a 2 columnas en ≤768px (Req 6.*, 7.*, 8.*, 10.*, 11.*).

## Notes

- Las tareas marcadas con `*` son opcionales (tests de propiedad con fast-check) y pueden omitirse para un MVP más rápido; se ejecutan en un entorno Node separado y NO agregan dependencias al HTML (Req 11.4).
- Cada tarea referencia requisitos específicos para trazabilidad.
- Los checkpoints aseguran validación incremental en navegador.
- La decisión clave de eliminar el reseteo de `contadorLineasRRHH` (tarea 1.2) es la base de la unicidad global de ids y la ausencia de regresión y colisión.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["5.1", "5.2"] },
    { "id": 6, "tasks": ["6.1", "6.2", "5.3"] },
    { "id": 7, "tasks": ["6.3", "6.4", "6.5"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3", "8.4", "8.5", "8.6"] }
  ]
}
```
