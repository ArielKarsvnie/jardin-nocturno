# jardín nocturno

Un jardín que crece con nosotros. Sitio estático (HTML + CSS + JS, sin build) publicado en GitHub Pages.

Todo el contenido vive en `data/`. Para sumar recuerdos, cartas o preguntas **no hace falta tocar HTML ni JS**.

---

## Admin: editar desde el celular, sin código

Entrá a **https://arielkarsvnie.github.io/jardin-nocturno/admin.html**. Tiene tres pestañas:

- **Recuerdos:** agregar, editar y borrar flores, con foto.
- **Cartas:** escribir cartas selladas y elegir el día y la hora en que se abren (hora de Argentina).
- **Preguntas:** las del juego de la semilla, con sus opciones, la correcta marcada y el orden.
- **Textos:** todos los textos de la página (botones, títulos, chistes) y la canción. Lo que cambiaste se marca en amarillo; guardás todo junto.

 Al tocar **Publicar**, la página hace los commits en GitHub sola, y el jardín se actualiza en 1 o 2 minutos. Las fotos se achican en el mismo celular y se suben sin GPS.

**La primera vez necesitás un token** (una llave con permiso solo para este repo):

1. Entrá a <https://github.com/settings/personal-access-tokens/new>.
2. **Token name:** `jardin-admin`. **Expiration:** la que quieras (por ejemplo, 1 año).
3. **Repository access:** *Only select repositories* → `jardin-nocturno`.
4. **Permissions:** tocá *+ Add permissions* (o abrí *Repository permissions*), buscá **Contents** y ponelo en *Read and write*.
5. **Generate token**, copialo (empieza con `github_pat_`) y pegalo en el admin.

El token queda guardado solo en ese navegador. Si usás otro celular o la compu, pegalo de nuevo ahí. En el admin hay un botón para olvidarlo. Si lo perdés o vence, creás otro: el viejo lo podés borrar desde la misma página de GitHub.

> **Importante:** el admin hace commits directo en GitHub. Si después vas a editar algo en VS Code, primero corré `git pull` para traer esos cambios. Si no, vas a tener conflictos.

Sin el token, `admin.html` solo muestra un candado: no deja ver ni cambiar nada.

---

## Preparar la compu (una sola vez)

```bash
python -m pip install pillow
```

```bash
git config core.hooksPath herramientas/hooks
```

El segundo comando activa un control que corre antes de cada commit:
- revisa que los JSON no tengan errores (si le falta o le sobra una coma, no deja hacer el commit y te dice la línea);
- optimiza las fotos nuevas (las pasa a WebP de 1200 px y **les borra la ubicación GPS**);
- te recuerda cuántos `[REEMPLAZAR]` quedan.

Si las fotos son de iPhone (`.heic`), instalá también `python -m pip install pillow-heif`.

---

## Probarlo

### En la compu

Dentro de la carpeta del proyecto:

```bash
python -m http.server 8000
```

Entrá a <http://localhost:8000>. Abrir `index.html` con doble clic no funciona (los datos no cargan).

Si cambiaste algo y no lo ves, recargá con **Ctrl + Shift + R**.

### En tu celular (misma red Wi-Fi)

1. Corré `ipconfig` y anotá la "Dirección IPv4" (algo como `192.168.0.15`).
2. Levantá el servidor así:
   ```bash
   python -m http.server 8000 --bind 0.0.0.0
   ```
3. En el celular, entrá a `http://192.168.0.15:8000`. Si Windows pregunta por el firewall, permití solo **redes privadas**.

### Trucos para probar

- **Ver la entrada como la primera vez:** borrá los datos del sitio en el navegador (o usá una ventana de incógnito).
- **Ver las cartas antes de su fecha** (solo funciona en tu compu o tu Wi-Fi, nunca en GitHub Pages):
  - <http://localhost:8000/?ahora=2026-11-08T23:59:50-03:00#cartas>: ves cómo se abre sola a medianoche.
  - <http://localhost:8000/?ahora=2026-11-10T12:00:00-03:00#cartas>: la ves ya abierta.

---

## Agregar un recuerdo (una flor nueva)

1. Copiá la foto a `fotos-originales/`, por ejemplo `primera-cita.jpg`.
2. En `data/recuerdos.json`, dentro de `"recuerdos": [ ... ]`, poné una coma después del último `}` y pegá:

```json
{
  "id": "primera-cita",
  "titulo": "La primera cita",
  "fecha": "2025-12-10",
  "foto": "primera-cita.jpg",
  "alt": "Los dos tomando un café en la plaza",
  "texto": "Lo que pasó ese día, en dos o tres oraciones.",
  "pie": "El chiste para el pie de foto",
  "flor": "jazmin"
}
```

- `id`: un nombre único, sin espacios. Sirve para que el jardín sepa qué flor es nueva.
- `fecha`: siempre `AAAA-MM-DD`. Las flores se ordenan por fecha.
- `alt`: una descripción corta de la foto, para lectores de pantalla.
- `texto`: puede ser un texto o una lista de párrafos `["Uno.", "Otro."]`.
- `flor` (opcional): `margarita`, `jazmin`, `aromo` o `calendula`. Si no la ponés, se elige sola.

3. Hacé el commit. La foto se optimiza sola. Cuando ella entre, la flor nueva va a tener un cartel de **¡nueva!**.

---

## Agregar una carta sellada

En `data/cartas.json`, dentro de `"cartas": [ ... ]`:

```json
{
  "id": "san-valentin-2027",
  "titulo": "Para el 14",
  "abre": "2027-02-14T00:00:00-03:00",
  "candado": "Faltan unos días. Andá eligiendo chocolates.",
  "texto": [
    "Primer párrafo.",
    "Segundo párrafo."
  ],
  "firma": "Arielito"
}
```

- `abre`: fecha y hora en que se abre. **Dejá siempre el `-03:00` al final** (hora de Argentina). Así se abre a medianoche de Argentina, aunque el celular esté en otra zona horaria.
- `candado`: lo que se ve si toca el sobre antes de tiempo. Si insiste, aparecen otros chistes (están en `textos.json`, en `cartas.insistencia`).

---

## Agregar o cambiar una pregunta del juego de la semilla

En `data/semilla.json`, dentro de `"preguntas": [ ... ]`:

```json
{
  "pregunta": "¿Qué pidió en la primera cita?",
  "opciones": [
    { "texto": "Un café con leche", "correcta": true },
    { "texto": "Una pizza entera para ella sola" },
    { "texto": "Que la lleve a Marte" }
  ],
  "siAcierta": "Exacto. Memoria de elefante.",
  "siFalla": "No, pero me gusta cómo pensás."
}
```

Las opciones se mezclan solas cada vez que se juega. Lo ideal son 3 o 4 preguntas.

---

## Cambiar textos de la página

Todos los textos de la interfaz están en `data/textos.json`: botones, títulos, chistes, mensajes. Cambiá lo que está a la derecha de los `:` y no toques los nombres de la izquierda. `{n}`, `{fecha}`, etc. se reemplazan solos.

La canción se configura en `data/musica.json`.

---

## Agregar un juego

1. Copiá la carpeta `js/juegos/_plantilla/` como `js/juegos/memotest/` (o el nombre que quieras) y programá el juego en `juego.js`. La plantilla explica qué recibe.
2. Anotalo en `data/juegos.json`:

```json
{
  "juegos": [
    { "id": "memotest", "titulo": "Memotest", "descripcion": "Encontrá las parejas", "modulo": "memotest" }
  ]
}
```

Si el juego necesita contenido propio, sumá `"datos": "memotest"` y creá `data/memotest.json`. Cada juego se carga por separado: si uno se rompe, los demás siguen andando. Con la lista vacía se ve el cartel de "próximamente".

---

## Publicar en GitHub Pages

### La primera vez

1. Entrá a <https://github.com/new>:
   - **Repository name:** `jardin-nocturno`
   - **Public** (GitHub Pages gratis necesita repo público)
   - No marques "Add a README" ni nada más.
   - **Create repository**.
2. En la carpeta del proyecto (cambiá `TU-USUARIO`):
   ```bash
   git remote add origin https://github.com/TU-USUARIO/jardin-nocturno.git
   ```
   ```bash
   git push -u origin main
   ```
   La primera vez se abre el navegador para que inicies sesión en GitHub.
3. En el repo, andá a **Settings → Pages**:
   - **Source:** Deploy from a branch
   - **Branch:** `main`, carpeta `/ (root)` → **Save**.
4. En uno o dos minutos la página queda en `https://TU-USUARIO.github.io/jardin-nocturno/`.

### Cada vez que sumes algo

```bash
git add -A
```

```bash
git commit -m "Nuevo recuerdo: primera cita"
```

```bash
git push
```

GitHub tarda uno o dos minutos en publicar, y el celular puede tardar hasta 10 minutos más en ver el cambio (por la caché).

### El tag NFC

Con una app como **NFC Tools** (Android o iPhone): *Escribir → Añadir un registro → URL* y poné `https://TU-USUARIO.github.io/jardin-nocturno/` (sin `#` al final, así siempre entra por la semilla). Probalo con tu celular antes de regalarlo.

---

## Privacidad

- El repo es público: **nunca** pongas direcciones, teléfonos, documentos ni nada que no quieras que lea un extraño.
- Las fotos originales (`fotos-originales/`) no se suben. Las que se suben no tienen GPS.
- La página tiene `noindex, nofollow`, así que los buscadores no deberían listarla.
- Las cartas se validan con la fecha del navegador: alguien que sepa de programación podría leerlas antes. Es un regalo, no una caja fuerte.
- La música se carga desde Spotify recién cuando se toca el botón del disco.

---

## Cómo está armado (por si hay que tocar código)

| Archivo | Qué hace |
|---|---|
| `index.html` | La página única con las 4 secciones y los dibujos SVG |
| `css/estilos.css` | Paleta (variables al principio), tipografías y animaciones |
| `js/app.js` | Navegación entre secciones (`#entrada`, `#jardin`, `#cartas`, `#juegos`) |
| `js/entrada.js` | Juego de la semilla |
| `js/jardin.js` + `js/tarjeta.js` | Flores y tarjeta de recuerdo |
| `js/cartas.js` | Sobres, cuenta regresiva y carta |
| `js/musica.js` | Botón de música y Spotify |
| `js/juegos.js` | Rincón de juegos |
| `herramientas/` | Script de fotos y control de commit |
