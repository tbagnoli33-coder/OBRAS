# Requirements Document

## Introduction

Esta feature conecta la aplicación de seguimiento de pedidos de hospitales (archivo único `OBRAS v9.html`, HTML+CSS+JS vanilla) a un Google Sheet real a través de un Google Apps Script publicado como Web App. Hoy la app usa datos demo embebidos (`DB_ARRAY_LOCAL`) y tiene exactamente dos puntos de integración preparados: la constante `GOOGLE_SHEETS_URL` (para lectura) y la función `persistirPedidoBackend(hospital, pedido)` (para escritura, hoy un no-op).

El trabajo se divide en dos partes: (1) el Apps Script, que se publica externamente y expone una URL `/exec`, y (2) el HTML, que implementa la lectura por `fetch` y la escritura por `POST` asíncrono. El objetivo es traer las filas del Sheet en tiempo real como cards, e insertar una fila por cada cargo al crear un pedido, manteniendo la app usable en memoria si la sincronización falla.

El contrato de datos (formato JSON de lectura y orden posicional del array `cargo`) NO cambia. Las firmas de las funciones de integración existentes se preservan.

Toda la lectura y escritura ocurre exclusivamente sobre la pestaña "2026" del documento de Google Sheets; cualquier otra pestaña del documento es ignorada por el Apps_Script.

## Glossary

- **Frontend**: La aplicación cliente contenida en el archivo `OBRAS v9.html` (HTML, CSS y JavaScript vanilla).
- **Apps_Script**: El Google Apps Script publicado como Web App que expone los endpoints `doGet` (lectura) y `doPost` (escritura) contra el Google Sheet.
- **Sheet**: El DOCUMENTO de Google Sheets (el archivo "Seguimiento de pedido de hospitales"), que puede contener varias pestañas (hojas/tabs).
- **Pestaña_Datos**: La pestaña (hoja/tab) llamada exactamente "2026" dentro del Sheet, que es la ÚNICA sobre la que Apps_Script lee, escribe y actualiza. Cualquier otra pestaña del documento debe ser ignorada. En Apps Script se selecciona mediante `getSheetByName("2026")`.
- **Web_App_URL**: La URL `/exec` que Apps Script genera al implementarse como Web App; se asigna a la constante `GOOGLE_SHEETS_URL` del Frontend.
- **Pedido**: Agrupación lógica de una o más filas del Sheet que comparten la clave HOSPITAL (columna A) + DENOMINACION (columna C) + TIPO (columna B) + FECHA (columna D).
- **Cargo**: Una fila individual del Sheet perteneciente a un Pedido; representa un puesto de RRHH.
- **Fila_De_Datos**: Una fila del Sheet a partir de la fila 3 (índice 2 en Apps Script), ya que las filas 1 y 2 son encabezados.
- **Fila_Encabezado**: Las dos primeras filas del Sheet. La fila 1 contiene agrupadores y la fila 2 contiene los nombres de columna.
- **Payload_Lectura**: El objeto JSON que Apps_Script devuelve en la lectura y que el Frontend consume, con la forma `{ hospitales, grupos?, catalogos? }`.
- **Payload_Escritura**: El objeto JSON que el Frontend envía en la escritura, con la forma `{ accion: "crear", hospital, pedido }`.
- **Contrato_Cargo**: El array posicional de 10 elementos que representa un Cargo en el Payload_Lectura: `[tipoQ, escalafon, puesto, qPlan, canal, qPedido, expediente, qAprobado, validado(0|1), resuelto(0|1)]`.

## Requirements

### Requirement 1: Configuración de la URL del Web App

**User Story:** Como responsable de la publicación del backend, quiero pegar la URL del Web App en un único punto del Frontend, para que la app lea y escriba contra el Google Sheet real sin más cambios de código.

#### Acceptance Criteria

1. THE Frontend SHALL exponer la constante `GOOGLE_SHEETS_URL` como único punto de configuración de la Web_App_URL.
2. WHERE la constante `GOOGLE_SHEETS_URL` contiene una cadena vacía, THE Frontend SHALL usar los datos locales `DB_ARRAY_LOCAL` para la lectura.
3. WHERE la constante `GOOGLE_SHEETS_URL` contiene una Web_App_URL no vacía, THE Frontend SHALL usar esa URL para las operaciones de lectura y de escritura.

### Requirement 2: Lectura de datos del Sheet (GET)

**User Story:** Como usuario de la app, quiero ver las filas del Google Sheet en tiempo real presentadas como cards, para trabajar sobre los datos reales de pedidos.

#### Acceptance Criteria

1. WHEN el Frontend inicia y la constante `GOOGLE_SHEETS_URL` contiene una Web_App_URL no vacía, THE Frontend SHALL solicitar el Payload_Lectura mediante una petición GET a la Web_App_URL.
2. WHEN Apps_Script recibe una petición GET, THE Apps_Script SHALL leer las Fila_De_Datos únicamente de la Pestaña_Datos ("2026") comenzando en la fila 3 y devolver el Payload_Lectura en formato JSON.
3. WHEN Apps_Script accede al Sheet, THE Apps_Script SHALL seleccionar la Pestaña_Datos por su nombre exacto "2026" e ignorar cualquier otra pestaña del documento.
4. THE Apps_Script SHALL excluir las dos Fila_Encabezado del Payload_Lectura.
5. WHEN Apps_Script construye el Payload_Lectura, THE Apps_Script SHALL agrupar en un mismo Pedido las Fila_De_Datos que comparten HOSPITAL (columna A), DENOMINACION (columna C), TIPO (columna B) y FECHA (columna D).
6. WHEN Apps_Script agrupa las Fila_De_Datos en un Pedido, THE Apps_Script SHALL representar cada Fila_De_Datos como un Cargo dentro del array `cargos` del Pedido.
7. THE Apps_Script SHALL representar cada Cargo con el Contrato_Cargo en el orden posicional `[tipoQ, escalafon, puesto, qPlan, canal, qPedido, expediente, qAprobado, validado, resuelto]`.
8. WHEN Apps_Script determina el valor `prioridad` de un Pedido, THE Apps_Script SHALL asignar "DESPRIORIZADO" si el valor de la columna G en minúsculas es igual a "despriorizado", y asignar "-" en cualquier otro caso.
9. THE Apps_Script SHALL conservar el nombre del hospital exactamente como aparece en la columna A del Sheet, sin normalizarlo.
10. WHEN el Frontend recibe el Payload_Lectura, THE Frontend SHALL renderizar los Pedidos como cards usando el mismo formato JSON que consume actualmente.

### Requirement 3: Manejo de errores de lectura

**User Story:** Como usuario de la app, quiero que la aplicación siga funcionando aunque falle la carga desde el Sheet, para no quedar bloqueado ante un problema de red o del backend.

#### Acceptance Criteria

1. IF la respuesta GET a la Web_App_URL devuelve un estado HTTP distinto de éxito, THEN THE Frontend SHALL mostrar un alert que informe que no se pudieron cargar los datos del Sheet e incluya el detalle del error.
2. IF la operación de lectura desde la Web_App_URL falla, THEN THE Frontend SHALL cargar los datos locales `DB_ARRAY_LOCAL` y continuar operando.

### Requirement 4: Escritura de un pedido nuevo (POST)

**User Story:** Como usuario de la app, quiero que al crear un pedido se inserten sus cargos como filas en el Google Sheet, para mantener el Sheet sincronizado con la aplicación.

#### Acceptance Criteria

1. THE Frontend SHALL mantener la firma de la función `persistirPedidoBackend` con exactamente dos parámetros: `hospital` y `pedido`.
2. WHEN el usuario crea un Pedido y la constante `GOOGLE_SHEETS_URL` contiene una Web_App_URL no vacía, THE Frontend SHALL enviar el Payload_Escritura mediante una petición POST asíncrona a la Web_App_URL.
3. WHEN el Frontend construye el Payload_Escritura, THE Frontend SHALL incluir los campos `accion` con valor "crear", `hospital` y `pedido`.
4. WHEN el Frontend envía la petición POST, THE Frontend SHALL establecer el header `Content-Type` con el valor `text/plain;charset=utf-8`.
5. WHEN Apps_Script recibe una petición POST con `accion` igual a "crear", THE Apps_Script SHALL insertar una Fila_De_Datos únicamente en la Pestaña_Datos ("2026") por cada Cargo presente en el array `cargos` del Pedido.
6. THE Apps_Script SHALL escribir el nombre del hospital en la columna A exactamente como llega en el Payload_Escritura, sin normalizarlo.
7. WHEN Apps_Script inserta las Fila_De_Datos de un Cargo, THE Apps_Script SHALL ubicar cada campo del Cargo en la columna correspondiente según el mapeo de columnas del Sheet.
8. WHEN Apps_Script completa la inserción de las Fila_De_Datos, THE Apps_Script SHALL devolver una respuesta que indique el resultado de la operación.

### Requirement 5: Confirmación y manejo de errores de escritura

**User Story:** Como usuario de la app, quiero saber si el pedido se sincronizó con el Sheet o no, para poder reaccionar sin perder mi trabajo en memoria.

#### Acceptance Criteria

1. WHEN el usuario crea un Pedido, THE Frontend SHALL agregar el Pedido a los datos en memoria antes de resolver la petición POST.
2. WHEN la petición POST de escritura se completa con éxito, THE Frontend SHALL confirmar al usuario que la sincronización con el Sheet fue exitosa.
3. IF la petición POST de escritura falla, THEN THE Frontend SHALL mostrar un alert que informe que la sincronización con el Sheet no se completó e incluya el detalle del error.
4. IF la petición POST de escritura falla, THEN THE Frontend SHALL conservar el Pedido en los datos en memoria y mantener la aplicación operable.

### Requirement 6: Consistencia del contrato de datos

**User Story:** Como desarrollador que mantiene la app, quiero que el contrato de datos se conserve intacto, para que la conexión al Sheet no rompa el renderizado ni la lógica existente.

#### Acceptance Criteria

1. THE Apps_Script SHALL producir un Payload_Lectura cuyo objeto `hospitales` mapea cada nombre de hospital a un array de Pedidos.
2. THE Apps_Script SHALL representar cada Pedido con los campos `tipo`, `detalle`, `fecha`, `prioridad` y `cargos`.
3. THE Apps_Script SHALL incluir los campos `grupos` y `catalogos` en el Payload_Lectura solo cuando existan datos para ellos, tratándolos como opcionales.
4. THE Frontend SHALL preservar el orden posicional de los 10 elementos del Contrato_Cargo sin modificarlo.
5. THE Frontend SHALL recortar el sufijo " - PROYECTO" del nombre del hospital únicamente para la presentación visual, sin alterar el valor enviado al Apps_Script.
6. WHEN un Cargo tiene el valor `resuelto` igual a 1 en la columna S, THE Frontend SHALL generar la card espejo del filtro RESUELTOS por su cuenta sin requerir una fila duplicada en el Sheet.

### Requirement 7: Actualización de celdas editables (extensión futura, opcional)

**User Story:** Como usuario de la app, quiero editar las celdas editables de filas existentes y que el cambio se refleje en el Sheet, para actualizar el seguimiento sin editar la hoja manualmente.

#### Acceptance Criteria

1. WHERE la funcionalidad de actualización está habilitada, THE Frontend SHALL enviar mediante POST a la Web_App_URL los cambios realizados sobre las celdas editables Q PEDIDO (columna P), Q APROBADO (columna R), VALIDADO (columna N) y RESUELTO (columna S) de una Fila_De_Datos existente.
2. WHERE la funcionalidad de actualización está habilitada, WHEN Apps_Script recibe una petición POST de actualización, THE Apps_Script SHALL modificar únicamente las celdas Q PEDIDO (columna P), Q APROBADO (columna R), VALIDADO (columna N) y RESUELTO (columna S) de la Fila_De_Datos indicada dentro de la Pestaña_Datos ("2026").
3. WHERE la funcionalidad de actualización está habilitada, IF la petición POST de actualización falla, THEN THE Frontend SHALL mostrar un alert con el detalle del error y mantener la aplicación operable.
