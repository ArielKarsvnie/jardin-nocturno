# jardín nocturno

Un jardín que crece con nosotros. Sitio estático (HTML + CSS + JS, sin build) para GitHub Pages.

## Probarlo en la compu

Los datos se leen con `fetch`, así que no funciona abriendo `index.html` con doble clic. En esta carpeta:

```bash
python -m http.server 8000
```

y entrá a <http://localhost:8000>.

## Dónde está cada cosa

- `data/` — todo el contenido: `textos.json`, `recuerdos.json`, `cartas.json`, `semilla.json`, `juegos.json`.
- `assets/` — fotos optimizadas e íconos.
- `fotos-originales/` — tus fotos sin procesar (no se suben a GitHub).
- `js/`, `css/` — el código. Para sumar contenido no hace falta tocarlos.

Lo que está marcado con `[REEMPLAZAR]` es de ejemplo.

## Fotos (automático)

1. Una sola vez en esta compu:
   ```bash
   python -m pip install pillow
   ```
   ```bash
   git config core.hooksPath herramientas/hooks
   ```
2. Copiá la foto a `fotos-originales/` (por ejemplo `primera-cita.jpg`).
3. En `data/recuerdos.json` poné `"foto": "primera-cita.jpg"`.
4. Hacé el commit. Antes de guardarlo se revisan los JSON y la foto se achica, se pasa a WebP, **se le borra la ubicación GPS** y queda en `assets/fotos/`.

No subas fotos con el botón "Upload" de la web de GitHub: así se saltea este paso.
Si son fotos de iPhone (`.heic`), instalá también `python -m pip install pillow-heif`.

> La guía completa para agregar recuerdos, cartas, preguntas y juegos llega en la Etapa 6.
