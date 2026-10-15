// Entrada: el mini-juego de "plantar la semilla".
// Cada respuesta riega la planta y la hace crecer; al final florece y se entra al jardín.
// Las preguntas salen de data/semilla.json. Si ya jugó, ofrece "entrar directo".

import { cargar, t } from './datos.js';
import { crear } from './dom.js';
import { yaPlantoLaSemilla, marcarSemillaPlantada, ir } from './estado.js';

const ETAPA_FLOR = 4;

let raiz;
let escena;
let el = {};
let preguntas = [];
let indice = 0;
let aciertos = 0;

async function cargarPreguntas() {
  try {
    const { preguntas: lista = [] } = await cargar('semilla');
    return lista;
  } catch (error) {
    // Sin preguntas igual se puede entrar: la planta florece directo.
    console.error(error);
    return [];
  }
}

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function setEtapa(etapa) {
  for (const parte of escena.querySelectorAll('.parte')) {
    const desde = Number(parte.dataset.desde ?? 0);
    const hasta = parte.dataset.hasta == null ? Infinity : Number(parte.dataset.hasta);
    parte.classList.toggle('visible', etapa >= desde && etapa <= hasta);
  }
}

// Reparte las preguntas respondidas en las 3 etapas de crecimiento (la 4 es la flor).
function etapaPara(respondidas) {
  return Math.max(1, Math.round((respondidas / preguntas.length) * 3));
}

function regar() {
  escena.classList.remove('regando');
  void escena.getBoundingClientRect(); // reinicia la animación de las gotas
  escena.classList.add('regando');
}

function lluviaDePetalos() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lugar = el.petalos;
  lugar.replaceChildren();
  for (let i = 0; i < 16; i++) {
    const petalo = crear('span', {
      class: `petalo${i % 3 === 0 ? ' petalo--amarillo' : ''}`,
      style: [
        `--x:${10 + Math.random() * 80}%`,
        `--dx:${Math.round(Math.random() * 80 - 40)}px`,
        `--giro:${Math.round(Math.random() * 540 - 270)}deg`,
        `--d:${(Math.random() * 0.6).toFixed(2)}s`,
        `--t:${(2.2 + Math.random() * 1.2).toFixed(2)}s`,
      ].join(';'),
    });
    petalo.addEventListener('animationend', () => petalo.remove(), { once: true });
    lugar.append(petalo);
  }
}

function mostrarPantalla(nombre, { enfocar = true } = {}) {
  raiz.dataset.modo = nombre;
  for (const pantalla of raiz.querySelectorAll('[data-pantalla]')) {
    pantalla.hidden = pantalla.dataset.pantalla !== nombre;
  }
  if (enfocar) raiz.querySelector(`[data-pantalla="${nombre}"] [tabindex="-1"]`)?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function mostrarIntro() {
  const volvio = yaPlantoLaSemilla();
  for (const elemento of raiz.querySelectorAll('[data-solo]')) {
    elemento.hidden = elemento.dataset.solo !== (volvio ? 'vuelta' : 'primera');
  }
  setEtapa(volvio ? ETAPA_FLOR : 0);
  mostrarPantalla('intro', { enfocar: false });
}

async function empezar() {
  preguntas = await cargarPreguntas();
  indice = 0;
  aciertos = 0;
  setEtapa(0);
  if (!preguntas.length) terminar();
  else mostrarPregunta();
}

function mostrarPregunta() {
  const pregunta = preguntas[indice];
  el.progreso.textContent = t('semilla.progreso', { i: indice + 1, n: preguntas.length });
  el.pregunta.textContent = pregunta.pregunta;
  el.opciones.classList.remove('respondida');
  el.opciones.replaceChildren(
    ...mezclar(pregunta.opciones ?? []).map((opcion) => {
      const boton = crear('button', {
        class: 'opcion',
        type: 'button',
        'data-correcta': opcion.correcta ? 'si' : null,
        texto: opcion.texto,
      });
      boton.addEventListener('click', () => responder(pregunta, opcion, boton));
      return crear('li', {}, boton);
    })
  );
  el.reaccion.textContent = '';
  el.siguiente.hidden = true;
  mostrarPantalla('pregunta');
}

function responder(pregunta, opcion, boton) {
  const acerto = Boolean(opcion.correcta);
  if (acerto) aciertos++;

  el.opciones.classList.add('respondida');
  for (const otro of el.opciones.querySelectorAll('button')) otro.disabled = true;
  boton.classList.add(acerto ? 'opcion--bien' : 'opcion--mal');
  if (!acerto) el.opciones.querySelector('[data-correcta]')?.classList.add('opcion--era');

  el.reaccion.textContent = (acerto ? pregunta.siAcierta : pregunta.siFalla)
    || t(acerto ? 'semilla.bienGenerico' : 'semilla.malGenerico');

  regar();
  setEtapa(etapaPara(indice + 1));

  const esLaUltima = indice + 1 >= preguntas.length;
  el.siguiente.textContent = t(esLaUltima ? 'semilla.verQueBroto' : 'semilla.siguiente');
  el.siguiente.hidden = false;
  el.siguiente.focus({ preventScroll: true });
  // En pantallas chicas el botón puede quedar abajo: lo traemos a la vista.
  const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.siguiente.scrollIntoView({ block: 'nearest', behavior: suave ? 'smooth' : 'auto' });
}

function avanzar() {
  indice++;
  if (indice < preguntas.length) mostrarPregunta();
  else terminar();
}

function puntaje() {
  const n = preguntas.length;
  if (!n) return t('semilla.final.sinPreguntas');
  if (aciertos === n) return t('semilla.final.todas', { b: aciertos, n });
  if (aciertos === 0) return t('semilla.final.ninguna', { b: aciertos, n });
  return t('semilla.final.algunas', { b: aciertos, n });
}

function terminar() {
  marcarSemillaPlantada();
  el.puntaje.textContent = puntaje();
  setEtapa(ETAPA_FLOR);
  lluviaDePetalos();
  mostrarPantalla('final');
}

function entrar() {
  marcarSemillaPlantada();
  ir('jardin');
}

export async function montar(seccion) {
  raiz = seccion.querySelector('.entrada');
  escena = seccion.querySelector('[data-escena]');
  const q = (sel) => seccion.querySelector(sel);
  el = {
    petalos: q('[data-petalos]'),
    progreso: q('[data-progreso]'),
    pregunta: q('[data-pregunta]'),
    opciones: q('[data-opciones]'),
    reaccion: q('[data-reaccion]'),
    siguiente: q('[data-accion="siguiente"]'),
    puntaje: q('[data-puntaje]'),
  };

  for (const boton of seccion.querySelectorAll('[data-accion="plantar"]')) boton.addEventListener('click', empezar);
  for (const boton of seccion.querySelectorAll('[data-accion="entrar"]')) boton.addEventListener('click', entrar);
  el.siguiente.addEventListener('click', avanzar);

  mostrarIntro();
  await cargarPreguntas();
}

// Cada vez que se vuelve a #entrada, arranca de la bienvenida.
export function alMostrar() {
  mostrarIntro();
}
