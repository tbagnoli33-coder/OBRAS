# OBRAS — Seguimiento de pedidos de hospitales

Aplicación web de una sola página (HTML + CSS + JavaScript vanilla, sin build) para
visualizar y crear pedidos de obra / RRHH de hospitales, conectada a un Google Sheet.

## Arquitectura

```
Navegador (index.html servido por Vercel)
   │
   ├── GET  → Google Apps Script Web App (/exec)  → lee la pestaña "2026" del Google Sheet
   └── POST → Google Apps Script Web App (/exec)  → inserta filas en la pestaña "2026"
```

- **Front**: `index.html`, archivo único estático. Se despliega en Vercel.
- **Backend**: Google Apps Script publicado como Web App. NO vive en este repo ni en Vercel;
  es un proyecto de Apps Script asociado al Google Sheet. El front se conecta a su URL `/exec`.

## Configuración

La conexión al backend se define en una sola constante dentro de `index.html`:

```js
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/.../exec";
```

- Si está vacía (`""`), la app usa datos de demostración embebidos (`DB_ARRAY_LOCAL`).
- Con la URL del Web App, lee y escribe contra el Google Sheet real.

## Despliegue en Vercel

1. Importar este repositorio en Vercel (New Project → Import Git Repository).
2. Framework Preset: **Other** (no hay build).
3. Build Command: vacío. Output Directory: vacío (raíz). Install Command: vacío.
4. Deploy. Vercel sirve `index.html` en la raíz del dominio.
5. Cada push a la rama principal vuelve a desplegar automáticamente.

## Notas de seguridad

- La URL del Apps Script queda visible en el código fuente del HTML (es público).
  Si el Web App está publicado con acceso "Cualquiera", cualquier persona con esa URL
  puede leer/escribir en el Sheet. Evaluar restringir el acceso según la sensibilidad de los datos.
- Los CSV con datos reales y los backups están excluidos del repo vía `.gitignore`.

## Estructura del repo

- `index.html` — la aplicación.
- `vercel.json` — configuración de hosting estático.
- `# Guía de integración Backend — App.txt` — documentación del contrato con el Apps Script.
- `.kiro/` — especificaciones de diseño (requirements / design / tasks).
