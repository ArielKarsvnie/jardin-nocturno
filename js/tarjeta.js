// Tarjeta de un recuerdo: foto tipo polaroid, fecha, anécdota y pie de foto.
// Se cierra como cualquier ventana (ver modal.js).
// Se pasa de un recuerdo a otro deslizando o con las flechas.

import { t } from './datos.js';
import { crear, icono } from './dom.js';
import { formatearFecha } from './fechas.js';
import { abrirModal } from './modal.js';

let dialogo;
let partes;
let lista = [];
let actual = 0;
let alVer;

// "primera-cita.jpg" → assets/fotos/primera-cita.webp (la versión que genera el script de fotos)
function rutaFoto(nombre) {
  return `assets/fotos/${nombre.replace(/\.[^./]+$/, '')}.webp`;
}

function sinFoto(recuerdo) {
  return crear('div', { class: 'tarjeta__sin-foto' },
    icono(`flor-${recuerdo.flor}`, '0 0 60 60'),
    crear('p', { class: 'manuscrita', texto: t('tarjeta.fotoPendiente') })
  );
}

function foto(recuerdo) {
  if (!recuerdo.foto) return sinFoto(recuerdo);
  const img = crear('img', { src: rutaFoto(recuerdo.foto), alt: recuerdo.alt || recuerdo.titulo, decoding: 'async' });
  img.addEventListener('error', () => img.replaceWith(sinFoto(recuerdo)), { once: true });
  return img;
}

function parrafos(texto) {
  const lista = Array.isArray(texto) ? texto : [texto ?? ''];
  return lista.filter(Boolean).map((p) => crear('p', { texto: p }));
}

function pintar(indice, direccion = 0) {
  actual = (indice + lista.length) % lista.length;
  const recuerdo = lista[actual];

  partes.foto.replaceChildren(foto(recuerdo));
  partes.pie.textContent = recuerdo.pie ?? '';
  partes.pie.hidden = !recuerdo.pie;
  partes.fecha.textContent = formatearFecha(recuerdo.fecha);
  partes.titulo.textContent = recuerdo.titulo ?? '';
  partes.cuerpo.replaceChildren(...parrafos(recuerdo.texto));
  partes.posicion.textContent = t('tarjeta.posicion', { i: actual + 1, n: lista.length });
  partes.pasos.hidden = lista.length < 2;

  // Cada tarjeta queda apenas torcida, como pegada a mano.
  partes.papel.style.setProperty('--giro', `${((actual * 7) % 5 - 2) * 0.7}deg`);
  partes.papel.scrollTop = 0;
  partes.papel.classList.remove('entra-desde-izq', 'entra-desde-der', 'entra');
  void partes.papel.offsetWidth; // reinicia la animación
  partes.papel.classList.add(direccion > 0 ? 'entra-desde-der' : direccion < 0 ? 'entra-desde-izq' : 'entra');

  alVer?.(recuerdo);
}

function mover(paso) {
  if (lista.length > 1) pintar(actual + paso, paso);
}

function preparar() {
  dialogo = document.querySelector('[data-tarjeta]');
  const q = (sel) => dialogo.querySelector(sel);
  partes = {
    papel: q('[data-papel]'),
    foto: q('[data-foto]'),
    pie: q('[data-pie]'),
    fecha: q('[data-fecha]'),
    titulo: q('[data-titulo]'),
    cuerpo: q('[data-cuerpo]'),
    posicion: q('[data-posicion]'),
    pasos: q('[data-pasos]'),
  };

  q('[data-accion="anterior"]').addEventListener('click', () => mover(-1));
  q('[data-accion="siguiente"]').addEventListener('click', () => mover(1));

  dialogo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') mover(1);
    if (e.key === 'ArrowLeft') mover(-1);
  });

  // Deslizar a los costados para pasar de recuerdo.
  let inicio = null;
  partes.papel.addEventListener('pointerdown', (e) => { inicio = { x: e.clientX, y: e.clientY }; });
  partes.papel.addEventListener('pointercancel', () => { inicio = null; });
  partes.papel.addEventListener('pointerup', (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) mover(dx < 0 ? 1 : -1);
  });
}

export function abrirTarjeta(recuerdos, indice, opciones = {}) {
  if (!dialogo) preparar();
  lista = recuerdos;
  alVer = opciones.alVer;
  pintar(indice);
  abrirModal(dialogo);
}
