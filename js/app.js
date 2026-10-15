// Punto de entrada: carga los textos y maneja la navegación entre secciones (#entrada, #jardin, ...).
// Es una sola página a propósito: así la música no se corta al cambiar de sección.

import { cargarTextos, aplicarTextos } from './datos.js';
import * as entrada from './entrada.js';
import * as jardin from './jardin.js';
import * as cartas from './cartas.js';
import * as juegos from './juegos.js';
import * as musica from './musica.js';

const SECCIONES = { entrada, jardin, cartas, juegos };
const montadas = new Set();

// Sin #sección (por ejemplo, al abrir desde el tag NFC) siempre se arranca por la entrada:
// la primera vez con el juego, después con el botón "entrar directo".
function rutaActual() {
  const id = location.hash.slice(1);
  return id in SECCIONES ? id : 'entrada';
}

async function mostrar(id, { enfocar = true } = {}) {
  document.body.dataset.ruta = id;

  for (const seccion of document.querySelectorAll('[data-seccion]')) {
    seccion.hidden = seccion.id !== id;
  }
  for (const enlace of document.querySelectorAll('[data-nav]')) {
    if (enlace.dataset.nav === id) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }

  const seccion = document.getElementById(id);
  window.scrollTo(0, 0);
  if (enfocar) seccion.querySelector('h1')?.focus({ preventScroll: true });

  // Cada sección se arma una sola vez, la primera vez que se visita.
  // Si además tiene alMostrar(), se llama cada vez que se entra.
  try {
    if (!montadas.has(id)) {
      montadas.add(id);
      await SECCIONES[id].montar(seccion);
    }
    SECCIONES[id].alMostrar?.(seccion);
  } catch (error) {
    console.error(error);
    mostrarAviso(`Algo no brotó en "${id}": ${error.message}`);
  }
}

function mostrarAviso(mensaje) {
  const aviso = document.querySelector('[data-aviso]');
  aviso.textContent = mensaje;
  aviso.hidden = false;
}

async function iniciar() {
  try {
    await cargarTextos();
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add('listo');
    mostrarAviso(
      location.protocol === 'file:'
        ? 'Abriste el archivo directo. Para que carguen los datos, corré "python -m http.server" en la carpeta y entrá a http://localhost:8000'
        : `No pude cargar los textos: ${error.message}`
    );
    return;
  }

  aplicarTextos();
  document.documentElement.classList.add('listo');
  addEventListener('hashchange', () => mostrar(rutaActual()));
  mostrar(rutaActual(), { enfocar: false });
  cartas.revisarNovedades().catch((error) => console.error(error));
  musica.montar().catch((error) => console.error(error));
}

iniciar();
