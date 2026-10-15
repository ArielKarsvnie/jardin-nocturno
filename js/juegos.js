// Rincón de juegos. Mientras data/juegos.json no tenga juegos, muestra el paquete de semillas "próximamente".
// Cuando sumemos el primer juego, cada uno va a vivir en su propia carpeta dentro de js/juegos/.

import { cargar, t } from './datos.js';
import { crear, plantilla } from './dom.js';

export async function montar(seccion) {
  const { juegos = [] } = await cargar('juegos');
  const lugar = seccion.querySelector('[data-juegos]');

  if (!juegos.length) {
    lugar.append(
      crear('article', { class: 'paquete', 'aria-labelledby': 'paquete-titulo' },
        crear('span', { class: 'paquete__sello', 'aria-hidden': 'true', texto: t('juegos.proximamente.sello') }),
        plantilla('tpl-margarita'),
        crear('h2', { id: 'paquete-titulo', texto: t('juegos.proximamente.titulo') }),
        crear('p', { texto: t('juegos.proximamente.texto') }),
        crear('p', { class: 'manuscrita', texto: t('juegos.proximamente.nota') })
      )
    );
  }
}
