// Cartas selladas: cada carta de data/cartas.json se abre en su fecha ("abre", hora de Argentina).
// Antes se ve el sobre con candado y la cuenta regresiva; después se puede leer y releer.
// Si la página está abierta justo en el momento, el sobre se abre solo.

import { cargar, t, tn, tLista } from './datos.js';
import { crear, icono } from './dom.js';
import { aFecha, ahora, formatearFecha } from './fechas.js';
import { abrirModal } from './modal.js';
import { cartaLeida, marcarCartaLeida } from './estado.js';

let cartas = [];
let lugar;
const insistencias = new Map();

async function cargarCartas() {
  const { cartas: lista = [] } = await cargar('cartas');
  return lista
    .map((carta) => ({
      ...carta,
      id: carta.id || `${carta.abre}-${carta.titulo}`,
      momento: aFecha(carta.abre ?? '').getTime(),
    }))
    .filter((carta) => !Number.isNaN(carta.momento))
    .sort((a, b) => a.momento - b.momento);
}

const estaAbierta = (carta) => ahora() >= carta.momento;

function cuantoFalta(ms) {
  const segundos = Math.ceil(ms / 1000);
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (dias >= 1) return tn('cartas.falta.dias', dias);
  if (horas >= 1) return t('cartas.falta.horas', { h: horas, m: minutos });
  if (minutos >= 1) return tn('cartas.falta.minutos', minutos);
  return tn('cartas.falta.segundos', segundos);
}

// Pinta el estado del sobre (cerrado/abierto/nuevo) y su texto. Se llama al crear y en cada tic del reloj.
function pintarEstado(carta, item) {
  const abierta = estaAbierta(carta);
  const nueva = abierta && !cartaLeida(carta.id);
  const sobre = item.querySelector('.sobre');
  const info = item.querySelector('[data-info]');

  sobre.classList.toggle('sobre--cerrada', !abierta);
  sobre.classList.toggle('sobre--abierta', abierta);
  sobre.classList.toggle('sobre--nueva', nueva);
  sobre.querySelector('.sobre__sello use').setAttribute('href', abierta ? '#ico-flor' : '#ico-candado');

  if (abierta) {
    const accion = t(cartaLeida(carta.id) ? 'cartas.releer' : 'cartas.leer');
    sobre.setAttribute('aria-label', `${carta.titulo}. ${accion}`);
    info.replaceChildren(crear('strong', { texto: accion }));
  } else {
    const falta = cuantoFalta(carta.momento - ahora());
    const cuando = t('cartas.abre', { fecha: formatearFecha(carta.abre, 'conHora') });
    sobre.setAttribute('aria-label', `${carta.titulo}. ${t('cartas.cerrada')}. ${falta}`);
    info.replaceChildren(crear('strong', { texto: falta }), crear('span', { texto: cuando }));
  }
}

function insistir(carta, item) {
  const veces = insistencias.get(carta.id) ?? 0;
  insistencias.set(carta.id, veces + 1);
  const otras = tLista('cartas.insistencia');
  const mensaje = veces === 0 || !otras.length
    ? carta.candado || t('cartas.candadoGenerico')
    : otras[(veces - 1) % otras.length];

  item.querySelector('[data-globo]').textContent = mensaje;
  const sobre = item.querySelector('.sobre');
  sobre.classList.remove('temblando');
  void sobre.offsetWidth; // reinicia la animación
  sobre.classList.add('temblando');
}

function leer(carta, item) {
  const dialogo = document.querySelector('[data-carta]');
  const q = (sel) => dialogo.querySelector(sel);
  const parrafos = Array.isArray(carta.texto) ? carta.texto : [carta.texto ?? ''];

  q('[data-fecha]').textContent = formatearFecha(carta.abre);
  q('[data-titulo]').textContent = carta.titulo ?? '';
  q('[data-cuerpo]').replaceChildren(...parrafos.filter(Boolean).map((p) => crear('p', { texto: p })));
  q('[data-firma]').textContent = carta.firma ? `— ${carta.firma}` : '';

  const papel = q('[data-papel]');
  papel.scrollTop = 0;
  papel.classList.remove('desplegar');
  void papel.offsetWidth;
  papel.classList.add('desplegar');
  abrirModal(dialogo);

  marcarCartaLeida(carta.id);
  item.querySelector('[data-globo]').textContent = '';
  pintarEstado(carta, item);
  marcarNovedad();
}

function crearSobre(carta, indice) {
  const item = crear('li', { class: 'carta-item', 'data-id': carta.id });
  const sobre = crear('button', {
      class: 'sobre',
      type: 'button',
      style: `--giro:${indice % 2 ? 1.2 : -1.2}deg`,
      onclick: () => (estaAbierta(carta) ? leer(carta, item) : insistir(carta, item)),
    },
    crear('span', { class: 'sobre__hoja', 'aria-hidden': 'true' }),
    crear('span', { class: 'sobre__solapa', 'aria-hidden': 'true' }),
    crear('span', { class: 'sobre__pliegue', 'aria-hidden': 'true' }),
    crear('span', { class: 'sobre__titulo manuscrita', 'aria-hidden': 'true', texto: carta.titulo }),
    crear('span', { class: 'sobre__sello', 'aria-hidden': 'true' }, icono('ico-candado')),
    crear('span', { class: 'sobre__nueva manuscrita', 'aria-hidden': 'true', texto: t('cartas.nueva') })
  );
  item.append(
    sobre,
    crear('p', { class: 'sobre__info', 'data-info': '' }),
    crear('p', { class: 'sobre__globo manuscrita', 'data-globo': '', 'aria-live': 'polite' })
  );
  pintarEstado(carta, item);
  return item;
}

// Punto en el ícono de "Cartas" del menú si hay una carta abierta sin leer.
function marcarNovedad() {
  const hay = cartas.some((carta) => estaAbierta(carta) && !cartaLeida(carta.id));
  document.querySelector('[data-nav="cartas"]')?.classList.toggle('con-novedad', hay);
}

function tic() {
  if (lugar && !lugar.closest('[data-seccion]').hidden) {
    for (const carta of cartas) {
      const item = lugar.querySelector(`[data-id="${CSS.escape(carta.id)}"]`);
      if (!item) continue;
      const estabaCerrada = item.querySelector('.sobre').classList.contains('sobre--cerrada');
      pintarEstado(carta, item);
      if (estabaCerrada && estaAbierta(carta)) {
        item.querySelector('[data-globo]').textContent = t('cartas.recienAbierta');
      }
    }
  }
  marcarNovedad();
}

// Se llama al cargar la página, para el punto del menú aunque no haya entrado a Cartas.
export async function revisarNovedades() {
  cartas = await cargarCartas();
  marcarNovedad();
  setInterval(tic, 1000);
}

export async function montar(seccion) {
  if (!cartas.length) cartas = await cargarCartas();
  lugar = seccion.querySelector('[data-cartas]');

  if (!cartas.length) {
    lugar.append(crear('p', { class: 'vacio manuscrita', texto: t('cartas.vacio') }));
    return;
  }
  lugar.append(crear('ul', { class: 'cartas-lista' }, ...cartas.map(crearSobre)));
}
