/**
 * Apps Script — Tabla "Por proyecto (Salud Mental)" en vivo.
 * Lee la pestaña `Proyectos` del Sheet y la devuelve como JSON / JSONP.
 * La misma Web App URL sirve para Preview y para Vercel.
 *
 * Robusto frente a: rango ampliado, filas vacías, fila(s) TOTAL,
 * columnas extra a la derecha y celdas con fórmulas.
 *
 * DESPLIEGUE (IMPORTANTE si editás este archivo):
 *  1) Implementar -> Gestionar implementaciones -> (lápiz) Editar
 *     -> Versión: "Nueva versión" -> Implementar.
 *     (Si creás "Nueva implementación" te cambia la URL; usá "Editar"
 *      para conservar la misma URL /exec.)
 *  2) Ejecutar como: "Yo".  Quién tiene acceso: "Cualquiera".
 *  Los DATOS del Sheet se leen en cada request (no requieren re-desplegar);
 *  sólo re-desplegás si cambiás este CÓDIGO.
 */

var HOJA_PROYECTOS = 'Proyectos';

var COL_PROYECTO  = 'Proyecto';
var COL_PERIODO   = 'Periodo';
var COL_SUBTOTAL  = 'Subtotal';
var ESPECIALIDADES = ['M. Clínico', 'Pediatría', 'Psicología', 'Psiquiatría',
  'Trabajador Social', 'TO', 'Enfermería', 'Farmacéutico', 'Promotor',
  'Fonoaudiología', 'Psicopedagogía'];

// Palabras en la columna Proyecto que marcan filas que NO son proyectos (se saltan).
var FILAS_IGNORAR = ['total', 'subtotal', 'totales'];

function doGet(e) {
  try {
    return responder_(construirPayload_(), e);
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message ? err.message : err) }, e);
  }
}

function construirPayload_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_PROYECTOS);
  if (!hoja) throw new Error('No existe la pestaña "' + HOJA_PROYECTOS + '".');

  // Leer SOLO el bloque real de datos, no el rango inflado por formato/fórmulas.
  var ultFila = hoja.getLastRow();
  var ultCol  = hoja.getLastColumn();
  if (ultFila < 2 || ultCol < 1) {
    return { ok: true, columnas: ESPECIALIDADES, proyectos: [], total: 0, actualizado: new Date().toISOString() };
  }
  // Tope defensivo de columnas (la tabla llega hasta ~N/O): leemos hasta ultCol.
  var valores = hoja.getRange(1, 1, ultFila, ultCol).getValues();

  var headers = valores[0].map(function (h) { return normalizar_(h); });
  function idx(nombre) { return headers.indexOf(normalizar_(nombre)); }

  var iProy = idx(COL_PROYECTO);
  var iPer  = idx(COL_PERIODO);
  var iSub  = idx(COL_SUBTOTAL);
  if (iProy === -1) throw new Error('Falta la columna "' + COL_PROYECTO + '" en la fila 1.');

  var idxEsp = ESPECIALIDADES.map(function (c) { return idx(c); });

  var proyectos = [];
  var total = 0;

  for (var r = 1; r < valores.length; r++) {
    var fila = valores[r];
    var nombre = String(fila[iProy] == null ? '' : fila[iProy]).trim();
    if (!nombre) continue;                                   // fila vacía
    if (FILAS_IGNORAR.indexOf(normalizar_(nombre)) !== -1) continue; // fila TOTAL/SUBTOTAL

    var vals = {};
    ESPECIALIDADES.forEach(function (c, k) {
      var col = idxEsp[k];
      vals[c] = (col === -1) ? 0 : (Number(fila[col]) || 0);
    });

    var sub;
    if (iSub !== -1 && fila[iSub] !== '' && fila[iSub] != null) {
      sub = Number(fila[iSub]) || 0;
    } else {
      sub = ESPECIALIDADES.reduce(function (s, c) { return s + vals[c]; }, 0);
    }

    var periodo = (iPer === -1) ? '' : String(fila[iPer] == null ? '' : fila[iPer]).trim();

    proyectos.push({ nombre: nombre, periodo: periodo || '—', valores: vals, subtotal: sub });
    total += sub;
  }

  return {
    ok: true,
    columnas: ESPECIALIDADES,
    proyectos: proyectos,
    total: total,
    filas: proyectos.length,
    actualizado: new Date().toISOString()
  };
}

function normalizar_(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function responder_(obj, e) {
  var json = JSON.stringify(obj);
  var cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
