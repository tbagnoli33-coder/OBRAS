/**
 * Apps Script — Tabla "Por proyecto (Salud Mental)" en vivo.
 * Lee la pestaña `Proyectos` del Sheet y la devuelve como JSON para el módulo
 * SALUD MENTAL 22-26. La misma Web App URL sirve para Preview y para Vercel.
 *
 * DESPLIEGUE:
 *  1) Extensiones -> Apps Script, pegar este archivo.
 *  2) Implementar -> Nueva implementación -> tipo "Aplicación web".
 *  3) Ejecutar como: "Yo". Quién tiene acceso: "Cualquiera".
 *  4) Copiar la URL /exec y pegarla en index.html (HIST_PROYECTOS_URL).
 *  Al editar el Sheet, el endpoint devuelve los datos nuevos sin re-desplegar.
 */

// Nombre EXACTO de la pestaña que contiene la tabla por proyecto.
var HOJA_PROYECTOS = 'Proyectos';

// Encabezados esperados (fila 1). El orden de las especialidades es el del cuadro.
var COL_PROYECTO  = 'Proyecto';
var COL_PERIODO   = 'Periodo';
var COL_SUBTOTAL  = 'Subtotal';
var ESPECIALIDADES = ['M. Clínico', 'Pediatría', 'Psicología', 'Psiquiatría',
  'Trabajador Social', 'TO', 'Enfermería', 'Farmacéutico', 'Promotor',
  'Fonoaudiología', 'Psicopedagogía'];

function doGet(e) {
  try {
    var payload = construirPayload_();
    return responder_(payload, e);
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message ? err.message : err) }, e);
  }
}

function construirPayload_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_PROYECTOS);
  if (!hoja) {
    throw new Error('No existe la pestaña "' + HOJA_PROYECTOS + '". Revisá el nombre.');
  }

  var rango = hoja.getDataRange().getValues();
  if (rango.length < 2) {
    return { ok: true, columnas: ESPECIALIDADES, proyectos: [], total: 0, actualizado: new Date().toISOString() };
  }

  // Mapear encabezados -> índice de columna (tolerante a mayúsculas/espacios/acentos).
  var headers = rango[0].map(function (h) { return normalizar_(h); });
  function idx(nombre) { return headers.indexOf(normalizar_(nombre)); }

  var iProy = idx(COL_PROYECTO);
  var iPer  = idx(COL_PERIODO);
  var iSub  = idx(COL_SUBTOTAL);
  if (iProy === -1) throw new Error('Falta la columna "' + COL_PROYECTO + '" en la fila 1.');

  var idxEsp = ESPECIALIDADES.map(function (c) { return idx(c); });

  var proyectos = [];
  var total = 0;

  for (var r = 1; r < rango.length; r++) {
    var fila = rango[r];
    var nombre = String(fila[iProy] == null ? '' : fila[iProy]).trim();
    if (!nombre) continue; // saltar filas vacías

    var vals = {};
    ESPECIALIDADES.forEach(function (c, k) {
      var col = idxEsp[k];
      var v = (col === -1) ? 0 : Number(fila[col]) || 0;
      vals[c] = v;
    });

    // Subtotal: usa la columna del Sheet si existe; si no, suma las especialidades.
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
    actualizado: new Date().toISOString()
  };
}

// Normaliza para comparar encabezados: minúsculas, sin acentos, espacios colapsados.
function normalizar_(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Devuelve JSON. Soporta JSONP (?callback=) para evitar problemas de CORS en el navegador.
function responder_(obj, e) {
  var json = JSON.stringify(obj);
  var cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
