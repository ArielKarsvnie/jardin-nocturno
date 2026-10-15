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

> La guía completa para agregar recuerdos, cartas, preguntas y juegos llega en la Etapa 6.
