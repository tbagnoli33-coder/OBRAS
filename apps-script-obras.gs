/**
 * ============================================================================
 *  OBRAS — Web App backend (Google Apps Script)
 *  Backend de la aplicación OBRAS (index.html) conectada a este Google Sheet.
 * ----------------------------------------------------------------------------
 *  CÓMO PUBLICARLO (para el PROPIETARIO del Google Sheet):
 *    1. Abrir el Google Sheet → menú "Extensiones" → "Apps Script".
 *    2. Borrar TODO el código del editor y pegar este archivo completo.
 *    3. Guardar (Ctrl+S).
 *    4. "Implementar" → "Nueva implementación" → "Aplicación web":
 *         - Ejecutar como .......... Mi cuenta
 *         - Quién tiene acceso ..... Cualquiera
 *    5. Copiar la URL que termina en /exec y enviarla.
 *       (Esa URL se pega en index.html, en la constante GOOGLE_SHEETS_URL.)
 *
 *  QUÉ HACE:
 *    doGet(e)  : LEE la pestaña de datos y devuelve los pedidos agrupados.
 *                Si la petición viene con ?callback=... responde JSONP
 *                (callback({...})) — es OBLIGATORIO porque el frontend lee
 *                por JSONP desde el commit "Fix CORS en Vercel".
 *    doPost(e) : ESCRIBE filas en el Sheet. Acepta los dos formatos:
 *                a) { action:"insert", hospital, tipo, denominacion, fechaFin,
 *                    priorizacion, tipoQ, escalafon, puesto, qPlan, canal,
 *                    qPedido, expediente, qAprobado }
 *                    -> es el que envía HOY el frontend (1 request por cargo)
 *                b) { accion:"crear", hospital, pedido:{...} }
 *                    -> formato documentado (1 request por todo el pedido)
 *
 *  ESTRUCTURA DE LA HOJA (verificada contra el CSV exportado del Sheet):
 *    fila 1 = encabezados agrupados (IDENTIFICACIÓN / SOLICITUD / ...)
 *    fila 2 = nombres de columna    (HOSPITALES, TIPO, DENOMINACION, ...)
 *    fila 3 en adelante = datos
 *    Columnas: A hospital        B tipo           C denominación    D fecha fin
 *              G priorización    H tipo de Q      I escalafón       J puesto
 *              K q planificado   L canal          M validar DG      N validado
 *              P q pedido        Q expediente     R q aprobado      S resuelto
 * ============================================================================
 */

// Pestañas donde puede estar la tabla de datos (en orden de prioridad).
var NOMBRES_HOJA = ['2026', 'Seguimiento de pedido de hospitales'];

// Caché de la lectura: el Sheet pesa y Google limita la frecuencia de llamadas
// al Web App (responde 400/404 si se piden muchas seguidas). Con caché, la
// respuesta sale en milisegundos y casi nunca se llega a tocar el Sheet.
// Ponelo en 0 para desactivarla (siempre lee el Sheet en vivo).
var CACHE_SEGUNDOS = 60;
var CLAVE_CACHE_LECTURA = 'obras_lectura_v1';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

// Texto limpio de cualquier valor (null/undefined -> '').
function texto_(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

// Número seguro (vacío o no numérico -> 0).
function numero_(v) {
  if (v === null || v === undefined || v === '') return 0;
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

// TRUE booleano nativo o texto "TRUE"/"VERDADERO" (case-insensitive).
function esVerdadero_(v) {
  if (v === true) return true;
  var s = texto_(v).trim().toLowerCase();
  return s === 'true' || s === 'verdadero' || s === 'si' || s === 'sí';
}

// Fecha del Sheet -> texto "dd/MM/aa" (o "2026" si el valor es sólo el año).
function fechaTexto_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yy');
  }
  if (typeof v === 'number') {
    if (v >= 1900 && v <= 2100) return String(Math.round(v));         // sólo año
    var d = new Date(Math.round((v - 25569) * 86400 * 1000));           // serial
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yy');
  }
  return texto_(v).trim();
}

// Devuelve la pestaña de datos o lanza un error claro.
function obtenerHoja_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var i;
  for (i = 0; i < NOMBRES_HOJA.length; i++) {
    var h = ss.getSheetByName(NOMBRES_HOJA[i]);
    if (h) return h;
  }
  // Fallback: la primera hoja cuya columna A diga HOSPITALES.
  var hojas = ss.getSheets();
  for (i = 0; i < hojas.length; i++) {
    if (texto_(hojas[i].getRange(1, 1).getValue()).trim().toUpperCase() === 'HOSPITALES') {
      return hojas[i];
    }
  }
  var nombres = [];
  for (i = 0; i < hojas.length; i++) nombres.push(hojas[i].getName());
  throw new Error('No encontré la pestaña de datos. Pestañas disponibles: ' + nombres.join(', '));
}

// Analiza la columna A UNA sola vez y devuelve:
//   inicio : fila (1-based) de la primera fila de datos
//   ultima : fila (1-based) de la última fila con hospital en la columna A
// Leer la columna A una sola vez (y no dos) y no repetir getLastRow() reduce
// bastante el tiempo de ejecución del doGet.
function analizarTabla_(hoja) {
  var usadas = hoja.getLastRow();
  if (usadas < 1) return { inicio: 1, ultima: 0 };

  var colA = hoja.getRange(1, 1, usadas, 1).getValues();

  // Encabezado HOSPITALES en las primeras filas -> los datos empiezan después.
  var inicio = 3;
  var muestras = Math.min(5, colA.length);
  for (var i = 0; i < muestras; i++) {
    if (texto_(colA[i][0]).trim().toUpperCase() === 'HOSPITALES') { inicio = i + 2; break; }
  }

  // Última fila con hospital: por debajo sólo quedan filas residuales con
  // fórmulas en M/N/S (miles de filas vacías en A) que no interesan.
  var ultima = 0;
  for (var j = colA.length - 1; j >= 0; j--) {
    if (texto_(colA[j][0]).trim() !== '') { ultima = j + 1; break; }
  }
  return { inicio: inicio, ultima: ultima };
}

// Respuesta JSONP si viene ?callback=..., JSON puro en caso contrario.
function responderJson_(e, json) {
  var cb = '';
  if (e && e.parameter && e.parameter.callback) cb = texto_(e.parameter.callback).trim();

  // Sólo se aceptan identificadores válidos (evita inyección de JS).
  var esIdentificador = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(cb);
  if (cb && esIdentificador) {
    json = json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    return ContentService
      .createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JS);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function responder_(e, obj) {
  return responderJson_(e, JSON.stringify(obj));
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Caché (best effort: si CacheService no está disponible, se ignora) ---
function cacheLeer_(clave) {
  try {
    var v = CacheService.getScriptCache().get(clave);
    return (v === null || v === undefined) ? null : String(v);
  } catch (err) { return null; }
}
function cacheEscribir_(clave, valor, segundos) {
  try { CacheService.getScriptCache().put(clave, valor, segundos); } catch (err) {}
}
function cacheBorrar_() {
  try { CacheService.getScriptCache().remove(CLAVE_CACHE_LECTURA); } catch (err) {}
}

// ---------------------------------------------------------------------------
// LECTURA (GET)
// ---------------------------------------------------------------------------

/**
 * Devuelve { ok:true, hospitales:{ "<Hospital>":[ pedido, ... ] } }.
 * Un pedido = filas que comparten A(hospital) + C(denominación) + B(tipo) + D(fecha).
 * Cada cargo es un array posicional:
 *   [tipoQ, escalafon, puesto, qPlan, canal, qPedido, expediente,
 *    qAprobado, validado(0|1), resuelto(0|1)]
 */
function doGet(e) {
  try {
    // Caché: si ya hay una lectura fresca, se responde sin tocar el Sheet.
    var usarCache = CACHE_SEGUNDOS > 0 &&
      !(e && e.parameter && texto_(e.parameter.sin_cache) === '1');
    if (usarCache) {
      var guardado = cacheLeer_(CLAVE_CACHE_LECTURA);
      if (guardado !== null) return responderJson_(e, guardado);
    }

    var hoja = obtenerHoja_();
    var rango = analizarTabla_(hoja);          // inicio y ultima (1-based)
    var inicio = rango.inicio;
    var ultima = rango.ultima;

    if (ultima < inicio) {
      return responder_(e, { ok: true, hospitales: {} });
    }

    // Sólo se leen las filas con datos reales (de la 1 a la última con hospital).
    var filas = hoja.getRange(1, 1, ultima, hoja.getLastColumn()).getValues();

    var hospitales = {};
    var mapaPedidos = {};

    for (var i = inicio - 1; i < filas.length; i++) {
      var f = filas[i];
      var hospital = texto_(f[0]).trim();                 // A
      if (!hospital) continue;

      var tipo = texto_(f[1]).trim();                     // B
      var detalle = texto_(f[2]).trim();                  // C
      var fecha = fechaTexto_(f[3]);                      // D
      var prioridad = texto_(f[6]).trim().toLowerCase() === 'despriorizado'
        ? 'DESPRIORIZADO'                                 // G
        : '-';

      var cargo = [
        texto_(f[7]).trim(),        // 0 tipoQ       (H)
        texto_(f[8]).trim(),        // 1 escalafon   (I)
        texto_(f[9]).trim(),        // 2 puesto      (J)
        numero_(f[10]),             // 3 qPlan       (K)
        texto_(f[11]).trim(),       // 4 canal       (L)
        numero_(f[15]),             // 5 qPedido     (P)
        texto_(f[16]).trim(),       // 6 expediente  (Q)
        numero_(f[17]),             // 7 qAprobado   (R)
        esVerdadero_(f[13]) ? 1 : 0,// 8 validado    (N)
        esVerdadero_(f[18]) ? 1 : 0 // 9 resuelto    (S)
      ];

      var clave = hospital + '||' + detalle + '||' + tipo + '||' + fecha;
      if (!mapaPedidos[clave]) {
        var pedido = [tipo, detalle, fecha, prioridad, []];
        mapaPedidos[clave] = pedido;
        if (!hospitales[hospital]) hospitales[hospital] = [];
        hospitales[hospital].push(pedido);
      }
      mapaPedidos[clave][4].push(cargo);
    }

    var payload = { ok: true, hospitales: hospitales };
    var json = JSON.stringify(payload);
    // Sólo se cachea si entra en el límite de CacheService (~100 KB por clave).
    if (usarCache && json.length < 95000) cacheEscribir_(CLAVE_CACHE_LECTURA, json, CACHE_SEGUNDOS);
    return responderJson_(e, json);
  } catch (err) {
    return responder_(e, {
      ok: false,
      error: texto_(err && err.message ? err.message : err)
    });
  }
}

// ---------------------------------------------------------------------------
// ESCRITURA (POST)
// ---------------------------------------------------------------------------

// Escribe las filas recibidas debajo de la última fila con datos de la tabla.
function escribirFilas_(hoja, listaFilas) {
  var base = analizarTabla_(hoja).ultima;
  if (base < 1) {
    for (var k = 0; k < listaFilas.length; k++) hoja.appendRow(listaFilas[k]);
    cacheBorrar_();
    return listaFilas.length;
  }
  var ref = base;
  for (var i = 0; i < listaFilas.length; i++) {
    hoja.insertRowAfter(ref, 1);
    ref++;
    hoja.getRange(ref, 1, 1, listaFilas[i].length).setValues([listaFilas[i]]);
  }
  cacheBorrar_(); // que la próxima lectura traiga las filas recién escritas
  return listaFilas.length;
}

// Construye la fila (24 columnas A..X) a partir del objeto plano que envía
// el frontend con action:"insert" (1 request por cargo).
function filaDesdeInsert_(d) {
  var despriorizado = texto_(d.priorizacion).trim().toLowerCase() === 'despriorizado';
  return [
    texto_(d.hospital),        // A  HOSPITALES
    texto_(d.tipo),            // B  TIPO
    texto_(d.denominacion),    // C  DENOMINACION
    texto_(d.fechaFin),        // D  OBRA FECHA FIN
    '',                        // E  CATEGORIA
    '',                        // F  EJERCICIO PRESUP
    despriorizado ? 'despriorizado' : '', // G PRIORIZACION MSGC
    texto_(d.tipoQ),           // H  TIPO DE Q
    texto_(d.escalafon),       // I  ESCALAFON
    texto_(d.puesto),          // J  PUESTO NUEVO
    numero_(d.qPlan),          // K  Q (planificado)
    texto_(d.canal),           // L  CANAL SOLICITUD
    false,                     // M  Validar DG
    d.validado === true,       // N  VALIDADO SSAH
    '',                        // O  PEDIDO A HACIENDA
    numero_(d.qPedido),        // P  Q PEDIDO
    texto_(d.expediente),      // Q  Expediente
    numero_(d.qAprobado),      // R  Q APROBADO HACIENDA
    d.resuelto === true,       // S  RESUELTO
    '', '', '', '', ''         // T..X
  ];
}

// Formato documentado (1 request por pedido con N cargos).
function crearFilas_(hospital, pedido) {
  var prioriG = (pedido && pedido.prioridad === 'DESPRIORIZADO') ? 'despriorizado' : '';
  var cargos = (pedido && pedido.cargos) || [];
  var lista = [];
  for (var i = 0; i < cargos.length; i++) {
    var c = cargos[i];
    lista.push([
      texto_(hospital), texto_(pedido.tipo), texto_(pedido.detalle),
      texto_(pedido.fecha), '', '', prioriG,
      texto_(c.tipoQ), texto_(c.escalafon), texto_(c.puesto),
      numero_(c.qPlan), texto_(c.canal),
      false, c.validado === true, '',
      numero_(c.qPedido), texto_(c.expediente), numero_(c.qAprobado),
      c.resuelto === true, '', '', '', '', ''
    ]);
  }
  if (!lista.length) throw new Error('El pedido no tiene cargos.');
  return escribirFilas_(obtenerHoja_(), lista);
}

// Actualización de celdas puntuales (Q PEDIDO / Q APROBADO / VALIDADO / RESUELTO).
// Busca la fila por HOSPITAL(A) + DENOMINACION(C) + ESCALAFON(I) + PUESTO(J).
function actualizarFilas_(hoja, datos) {
  var c = datos.cargo || datos.campos || {};
  var filas = hoja.getDataRange().getValues();
  var coincidencias = 0;
  var objetivo = -1;
  var indice = (c.indice === undefined || c.indice === null) ? 0 : Number(c.indice);

  for (var i = 2; i < filas.length; i++) {
    var f = filas[i];
    var mismo =
      texto_(f[0]).trim() === texto_(datos.hospital).trim() &&
      texto_(f[2]).trim() === texto_(datos.detalle || datos.denominacion).trim() &&
      texto_(f[8]).trim() === texto_(c.escalafon).trim() &&
      texto_(f[9]).trim() === texto_(c.puesto).trim();
    if (mismo) {
      if (coincidencias === indice) { objetivo = i + 1; break; }
      coincidencias++;
    }
  }

  if (objetivo === -1) {
    return { ok: false, error: 'No encontré la fila a actualizar.' };
  }
  // Columnas (1-based): N=14 validado, P=16 qPedido, R=18 qAprobado, S=19 resuelto
  if (c.qPedido !== undefined) hoja.getRange(objetivo, 16).setValue(numero_(c.qPedido));
  if (c.qAprobado !== undefined) hoja.getRange(objetivo, 18).setValue(numero_(c.qAprobado));
  if (c.validado !== undefined) hoja.getRange(objetivo, 14).setValue(c.validado === true);
  if (c.resuelto !== undefined) hoja.getRange(objetivo, 19).setValue(c.resuelto === true);
  return { ok: true, fila: objetivo };
}

/**
 * POST — ruteo por acción.
 *   action/accion = "insert" o "crear"  -> inserta filas
 *   action/accion = "actualizar"        -> actualiza celdas puntuales
 */
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
    var accion = texto_(body.action !== undefined ? body.action : body.accion).trim().toLowerCase();
    var hoja = obtenerHoja_();

    // Formato documentado: { accion:"crear", hospital, pedido:{ cargos:[...] } }
    if (body.pedido && (accion === '' || accion === 'crear' || accion === 'create')) {
      return jsonOut_({ ok: true, filas: crearFilas_(body.hospital, body.pedido) });
    }

    // Formato del frontend actual: 1 request por cargo.
    if (accion === '' || accion === 'insert' || accion === 'crear' || accion === 'create') {
      if (!texto_(body.hospital).trim()) throw new Error('Falta el hospital.');
      return jsonOut_({ ok: true, filas: escribirFilas_(hoja, [filaDesdeInsert_(body)]) });
    }

    if (accion === 'actualizar' || accion === 'update') {
      return jsonOut_(actualizarFilas_(hoja, body));
    }

    return jsonOut_({ ok: false, error: 'Acción no reconocida: ' + accion });
  } catch (err) {
    return jsonOut_({ ok: false, error: texto_(err && err.message ? err.message : err) });
  }
}
