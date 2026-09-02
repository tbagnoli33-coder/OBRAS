/**
 * Web App para conectar OBRAS v9.html con el Google Sheet.
 * TODAS las operaciones (doGet / doPost / actualizarFilas) leen y escriben
 * EXCLUSIVAMENTE la pestaña "2026" del documento.
 * Pegar este código en Extensiones > Apps Script y publicar como Aplicación web.
 *
 * Contenido:
 *   - getHoja2026_()  : acceso único a la pestaña "2026"
 *   - esVerdadero_(v) : normaliza TRUE booleano o texto "TRUE"
 *   - jsonOut_(obj)   : respuesta JSON con ContentService
 *   - doGet(e)        : (tarea 2.1) lectura
 *   - crearFilas_()   : (tarea 3.1) inserción de filas
 *   - doPost(e)       : (tarea 3.2) ruteo de escritura
 *   - actualizarFilas : (tarea 7.1, opcional)
 */

// Devuelve la pestaña "2026" o lanza un error claro si no existe.
// TODAS las operaciones pasan por aquí (Requirements 2.3, 4.5, 7.2).
function getHoja2026_() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("2026");
  if (!hoja) {
    throw new Error('No se encontró la pestaña "2026" en el documento.');
  }
  return hoja;
}

// Interpreta TRUE booleano nativo o texto "TRUE" (case-insensitive) como verdadero.
function esVerdadero_(v) {
  if (v === true) return true;
  return String(v).trim().toLowerCase() === "true";
}

// Respuesta JSON estándar del Web App.
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
// === LECTURA (GET) — Requirements 2 y 6 ===
// Lee la pestaña "2026" desde la fila 3, agrupa por HOSPITAL+DENOMINACION+TIPO+FECHA
// y devuelve el JSON posicional que consume normalizarPayload() del frontend.
function doGet(e) {
  try {
    var hoja = getHoja2026_();                    // Requirement 2.3 — pestaña por nombre exacto
    var filas = hoja.getDataRange().getValues();  // matriz 0-based
    var hospitales = {};
    var mapaPedidos = {};                          // clave compuesta -> referencia al pedido posicional

    // Datos desde la fila 3 => índice i = 2. Filas 0 y 1 son encabezados (Requirement 2.4).
    for (var i = 2; i < filas.length; i++) {
      var f = filas[i];
      var hospital = f[0];                         // col A
      if (hospital === "" || hospital == null) continue; // saltear filas sin hospital

      var tipo    = f[1];                          // B
      var detalle = f[2];                          // C
      var fecha   = f[3];                          // D

      // Requirement 2.8 — prioridad
      var prioridad = (String(f[6]).toLowerCase() === "despriorizado") ? "DESPRIORIZADO" : "-";

      // Requirement 2.7 — Contrato_Cargo posicional (10). validado/resuelto -> 0|1 (cols N/S).
      var validado = esVerdadero_(f[13]) ? 1 : 0;  // N
      var resuelto = esVerdadero_(f[18]) ? 1 : 0;  // S
      var cargo = [
        f[7],     // 0 tipoQ       (H)
        f[8],     // 1 escalafon   (I)
        f[9],     // 2 puesto      (J)
        f[10],    // 3 qPlan       (K)
        f[11],    // 4 canal       (L)
        f[15],    // 5 qPedido     (P)
        f[16],    // 6 expediente  (Q)
        f[17],    // 7 qAprobado   (R)
        validado, // 8             (N)
        resuelto  // 9             (S)
      ];

      // Requirement 2.5 — agrupar por HOSPITAL(A) + DENOMINACION(C) + TIPO(B) + FECHA(D)
      var clave = hospital + "||" + detalle + "||" + tipo + "||" + fecha;
      if (!mapaPedidos[clave]) {
        var pedido = [tipo, detalle, fecha, prioridad, []]; // Pedido posicional
        mapaPedidos[clave] = pedido;
        if (!hospitales[hospital]) hospitales[hospital] = []; // Requirement 2.9 — nombre tal cual
        hospitales[hospital].push(pedido);
      }
      mapaPedidos[clave][4].push(cargo);           // Requirement 2.6 — cada fila -> un cargo
    }

    // grupos/catalogos son opcionales (Requirement 6.3): esta versión no los emite.
    return jsonOut_({ hospitales: hospitales });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}
// === ESCRITURA — inserción de filas (Requirements 4.5, 4.6, 4.7) ===
// Inserta UNA fila por cada cargo del pedido en la pestaña "2026".
// Orden de columnas A..X según design.md. Devuelve la cantidad de filas escritas.
function crearFilas_(hospital, pedido) {
  var hoja = getHoja2026_();
  var prioriG = (pedido.prioridad === "DESPRIORIZADO") ? "despriorizado" : "";
  var cargos = pedido.cargos || [];
  cargos.forEach(function (c) {
    hoja.appendRow([
      hospital,        // A  HOSPITALES (sin normalizar — Requirement 4.6)
      pedido.tipo,     // B  TIPO
      pedido.detalle,  // C  DENOMINACION
      pedido.fecha,    // D  OBRA FECHA FIN
      "",              // E  CATEGORIA
      "",              // F  EJERCICIO PRESUP
      prioriG,         // G  PRIORIZACION MSGC
      c.tipoQ,         // H  TIPO DE Q
      c.escalafon,     // I  ESCALAFON
      c.puesto,        // J  PUESTO NUEVO
      c.qPlan,         // K  Q (planificado)
      c.canal,         // L  CANAL SOLICITUD
      false,           // M  Validar DG
      c.validado,      // N  VALIDADO SSAH (bool)
      "",              // O  PEDIDO A HACIENDA
      c.qPedido,       // P  Q PEDIDO
      c.expediente,    // Q  Expediente
      c.qAprobado,     // R  Q APROBADO HACIENDA
      c.resuelto,      // S  RESUELTO (bool)
      "", "", "", "", ""  // T..X
    ]);
  });
  return cargos.length;
}
// === ESCRITURA (POST) — ruteo por acción (Requirements 4.5, 4.8) ===
// Body llega como text/plain (evita preflight CORS) con un JSON { accion, ... }.
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var accion = body.accion;

    if (accion === "crear") {
      var filas = crearFilas_(body.hospital, body.pedido); // Requirement 4.5
      return jsonOut_({ ok: true, filas: filas });          // Requirement 4.8
    }

    // La acción "actualizar" se cablea en la tarea opcional 7.2.

    return jsonOut_({ ok: false, error: "Acción no reconocida: " + accion });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}
