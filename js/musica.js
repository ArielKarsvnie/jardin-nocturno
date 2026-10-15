// Música: botón de play/pausa (siempre visible) + reproductor de Spotify embebido.
// Spotify se carga recién al primer toque, así la página arranca liviana y sin autoplay.
// Algunos celulares no dejan que la página le dé play al reproductor: en ese caso
// se muestra el reproductor con un aviso para tocar su propio botón ▶.

import { cargar, t } from './datos.js';
import { crear, icono } from './dom.js';

const API_SPOTIFY = 'https://open.spotify.com/embed/iframe-api/v1';

let boton;
let panel;
let ayuda;
let cancion;
let controlador;
let preparando;
let sonando = false;
let esperaArranque;

// Acepta el link de "compartir" de Spotify o el código spotify:track:...
function aUri(enlace = '') {
  const id = enlace.match(/track[/:]([A-Za-z0-9]+)/)?.[1];
  return id ? `spotify:track:${id}` : '';
}

function cargarApi() {
  return new Promise((resolver, rechazar) => {
    window.onSpotifyIframeApiReady = resolver;
    const script = crear('script', { src: API_SPOTIFY, async: true });
    script.addEventListener('error', () => rechazar(new Error('No se pudo cargar Spotify')));
    document.head.append(script);
  });
}

async function crearReproductor() {
  const api = await cargarApi();
  return new Promise((resolver) => {
    const opciones = { uri: aUri(cancion.spotify), width: '100%', height: 80 };
    api.createController(panel.querySelector('[data-embed]'), opciones, (ctrl) => {
      ctrl.addListener('playback_update', (e) => marcarSonando(!e.data.isPaused));
      ctrl.addListener('ready', () => resolver(ctrl));
    });
  });
}

function marcarSonando(valor) {
  sonando = valor;
  boton.classList.toggle('sonando', valor);
  boton.setAttribute('aria-pressed', String(valor));
  boton.setAttribute('aria-label', t(valor ? 'musica.pausar' : 'musica.poner'));
  if (valor) {
    clearTimeout(esperaArranque);
    ayuda.hidden = true;
  }
}

function mostrarPanel(visible) {
  panel.classList.toggle('oculto', !visible);
  panel.inert = !visible;
}

// Si a los 2,5 s no empezó a sonar, el celular bloqueó el play: pedimos que toque el ▶ de Spotify.
function vigilarArranque() {
  clearTimeout(esperaArranque);
  esperaArranque = setTimeout(() => {
    if (sonando) return;
    ayuda.textContent = t('musica.ayuda');
    ayuda.hidden = false;
    mostrarPanel(true);
  }, 2500);
}

async function alTocar() {
  if (controlador) {
    if (!sonando) vigilarArranque();
    controlador.togglePlay();
    return;
  }

  mostrarPanel(true);
  if (!preparando) {
    boton.classList.add('cargando');
    preparando = crearReproductor().finally(() => boton.classList.remove('cargando'));
  }
  try {
    controlador = await preparando;
    vigilarArranque();
    controlador.play();
  } catch (error) {
    console.error(error);
    preparando = null;
    ayuda.textContent = t('musica.error');
    ayuda.hidden = false;
  }
}

export async function montar() {
  cancion = await cargar('musica');
  if (!aUri(cancion.spotify)) return;

  boton = crear('button', {
      class: 'musica-boton',
      type: 'button',
      'aria-pressed': 'false',
      'aria-label': t('musica.poner'),
      onclick: alTocar,
    },
    icono('ico-disco')
  );

  ayuda = crear('p', { class: 'musica-panel__ayuda', 'aria-live': 'polite', hidden: true });
  panel = crear('section', { class: 'musica-panel oculto', 'aria-label': t('musica.reproductor') },
    crear('div', { class: 'musica-panel__cabeza' },
      crear('p', { class: 'manuscrita', texto: `♪ ${cancion.cancion} · ${cancion.artista}` }),
      crear('button', {
          class: 'musica-panel__ocultar',
          type: 'button',
          'aria-label': t('musica.ocultar'),
          onclick: () => mostrarPanel(false),
        },
        icono('ico-cerrar')
      )
    ),
    ayuda,
    crear('div', { class: 'musica-panel__embed' }, crear('div', { 'data-embed': '' })),
    crear('p', { class: 'musica-panel__nota', texto: t('musica.nota') })
  );
  panel.inert = true;

  document.body.append(boton, panel);
}
