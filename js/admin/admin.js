// Admin del jardín: editar recuerdos, cartas y preguntas sin tocar código.
// Cada "Publicar" hace los commits en GitHub; la página se actualiza sola en 1 o 2 minutos.
// Cada pestaña vive en su propio archivo (recuerdos.js, cartas.js, preguntas.js, textos.js).

import { REPO, leerToken, guardarToken, olvidarToken, probarToken } from './github.js';
import { $, vista, estado, sinEstado } from './ui.js';
import * as recuerdos from './recuerdos.js';
import * as cartas from './cartas.js';
import * as preguntas from './preguntas.js';
import * as textos from './textos.js';

const SECCIONES = { recuerdos, cartas, preguntas, textos };

// Si hay cambios sin guardar en la pestaña actual, pregunta antes de irse.
const hayCambios = () => SECCIONES[actual].tieneCambios?.() ?? false;
addEventListener('beforeunload', (e) => {
  if (hayCambios()) e.preventDefault();
});
let actual = 'recuerdos';

async function irA(nombre) {
  // GitHub Pages deja que el navegador guarde los archivos hasta 10 minutos. Si justo hubo una
  // actualización, la página puede ser nueva y el código viejo (o al revés).
  if (!SECCIONES[nombre]) {
    estado('El admin se actualizó y este navegador tiene una parte vieja guardada. Cerrá y volvé a abrir la página (si sigue, esperá unos minutos).', 'error');
    return;
  }
  actual = nombre;
  for (const pestana of document.querySelectorAll('[data-pestana]')) {
    if (pestana.dataset.pestana === nombre) pestana.setAttribute('aria-current', 'page');
    else pestana.removeAttribute('aria-current');
  }
  vista('cargando');
  try {
    await SECCIONES[nombre].abrir();
  } catch (error) {
    console.error(error);
    if ([401, 403].includes(error.status)) {
      olvidarToken();
      vista('candado');
    } else {
      vista(`lista-${nombre}`);
    }
    estado(error.message, 'error');
  }
}

async function entrar() {
  vista('cargando');
  try {
    await probarToken();
  } catch (error) {
    if ([401, 403, 404].includes(error.status)) olvidarToken();
    vista('candado');
    estado(error.message, 'error');
    return;
  }
  $('[data-repo]').textContent = `Publicando en github.com/${REPO.duenio}/${REPO.nombre}`
    + (REPO.local ? ' (ojo: aunque estés en localhost, los cambios se publican de verdad).' : '.');
  await irA(actual);
}

$('[data-form-token]').addEventListener('submit', (e) => {
  e.preventDefault();
  const token = e.target.token.value.trim();
  if (!token) return;
  try {
    guardarToken(token);
  } catch (error) {
    estado(error.message, 'error');
    return;
  }
  e.target.reset();
  sinEstado();
  entrar();
});

$('[data-accion="olvidar"]').addEventListener('click', () => {
  olvidarToken();
  vista('candado');
  estado('Listo, este navegador ya no tiene el token.', 'ok');
});

for (const pestana of document.querySelectorAll('[data-pestana]')) {
  pestana.addEventListener('click', () => {
    if (pestana.dataset.pestana === actual && !document.querySelector(`[data-vista="lista-${actual}"]`).hidden) return;
    if (hayCambios() && !confirm('Tenés cambios sin guardar. ¿Salir igual?')) return;
    sinEstado();
    irA(pestana.dataset.pestana);
  });
}

for (const volver of document.querySelectorAll('[data-accion="volver"]')) {
  volver.addEventListener('click', () => {
    sinEstado();
    vista(`lista-${actual}`);
  });
}

document.documentElement.classList.add('listo');
if (leerToken()) entrar();
else vista('candado');
