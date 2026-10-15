// Cartas selladas. Etapa 1: solo cuenta cuántas hay en data/cartas.json.
// En la Etapa 4 se muestran con candado y se abren según la fecha.

import { cargar, t, tn } from './datos.js';
import { crear, icono } from './dom.js';

export async function montar(seccion) {
  const { cartas = [] } = await cargar('cartas');
  seccion.querySelector('[data-cartas]').append(
    crear('div', { class: 'tarjeta-suave' },
      icono('ico-sobre'),
      crear('p', { class: 'manuscrita', texto: tn('cartas.contador', cartas.length) }),
      crear('p', { texto: t('cartas.prontito') })
    )
  );
}
