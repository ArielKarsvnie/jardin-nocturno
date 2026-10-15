// Jardín. Etapa 1: un cantero con un brote por cada recuerdo de data/recuerdos.json.
// En la Etapa 2 los brotes se convierten en flores que abren su tarjeta.

import { cargar, t, tn } from './datos.js';
import { crear, plantilla } from './dom.js';

export async function montar(seccion) {
  const { recuerdos = [] } = await cargar('recuerdos');
  const lugar = seccion.querySelector('[data-jardin]');

  if (!recuerdos.length) {
    lugar.append(crear('p', { class: 'vacio manuscrita', texto: t('jardin.vacio') }));
    return;
  }

  const brotes = recuerdos.map((_, i) => {
    const brote = plantilla('tpl-brote');
    brote.style.setProperty('--i', i);
    return brote;
  });

  lugar.append(
    crear('div', { class: 'cantero' },
      crear('div', { class: 'cantero__brotes' }, ...brotes),
      crear('div', { class: 'cantero__tierra' })
    ),
    crear('p', { class: 'contador manuscrita', texto: tn('jardin.contador', recuerdos.length) })
  );
}
