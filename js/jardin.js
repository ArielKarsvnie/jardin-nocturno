// Jardín: una flor por cada recuerdo de data/recuerdos.json, ordenadas por fecha.
// Tocar una flor abre su tarjeta.

import { cargar, t, tn } from './datos.js';
import { crear, icono } from './dom.js';
import { formatearFecha } from './fechas.js';
import { recuerdosNuevos, marcarRecuerdoVisto } from './estado.js';
import { abrirTarjeta } from './tarjeta.js';

export const FLORES = ['margarita', 'jazmin', 'aromo', 'calendula'];

// Número estable a partir de un texto: la misma flor sale siempre igual.
export function semilla(texto) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.codePointAt(0)) | 0;
  return Math.abs(h);
}

function normalizar(recuerdo) {
  const id = recuerdo.id || `${recuerdo.fecha}-${recuerdo.titulo}`;
  const flor = FLORES.includes(recuerdo.flor) ? recuerdo.flor : FLORES[semilla(id) % FLORES.length];
  return { ...recuerdo, id, flor, fecha: recuerdo.fecha || '' };
}

function crearFlor(recuerdo, indice, esNueva, alTocar) {
  const alto = 64 + (semilla(`${recuerdo.id}-alto`) % 64);
  const fechaLarga = formatearFecha(recuerdo.fecha);

  return crear('button', {
      class: `flor${esNueva ? ' flor--nueva' : ''}`,
      type: 'button',
      'data-id': recuerdo.id,
      'aria-label': fechaLarga ? `${recuerdo.titulo}, ${fechaLarga}` : recuerdo.titulo,
      style: `--i:${indice};--alto:${alto}px`,
      onclick: alTocar,
    },
    esNueva && crear('span', { class: 'flor__nueva manuscrita', 'aria-hidden': 'true', texto: t('jardin.nueva') }),
    crear('span', { class: 'flor__planta' },
      crear('span', { class: 'flor__cabeza' }, icono(`flor-${recuerdo.flor}`, '0 0 60 60')),
      crear('span', { class: 'flor__tallo' })
    ),
    crear('span', { class: 'flor__tierra' }),
    crear('span', { class: 'flor__fecha manuscrita', 'aria-hidden': 'true', texto: formatearFecha(recuerdo.fecha, 'corta') })
  );
}

export async function montar(seccion) {
  const { recuerdos = [] } = await cargar('recuerdos');
  const lugar = seccion.querySelector('[data-jardin]');

  if (!recuerdos.length) {
    lugar.append(crear('p', { class: 'vacio manuscrita', texto: t('jardin.vacio') }));
    return;
  }

  const lista = recuerdos.map(normalizar).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const nuevos = recuerdosNuevos(lista.map((r) => r.id));

  const alVer = (recuerdo) => {
    marcarRecuerdoVisto(recuerdo.id);
    const flor = lugar.querySelector(`.flor[data-id="${CSS.escape(recuerdo.id)}"]`);
    flor?.classList.remove('flor--nueva');
    flor?.querySelector('.flor__nueva')?.remove();
  };

  const flores = lista.map((recuerdo, i) =>
    crearFlor(recuerdo, i, nuevos.has(recuerdo.id), () => abrirTarjeta(lista, i, { alVer }))
  );

  lugar.append(
    crear('div', { class: 'cantero' }, ...flores),
    crear('p', { class: 'contador manuscrita', texto: tn('jardin.contador', lista.length) })
  );
}
