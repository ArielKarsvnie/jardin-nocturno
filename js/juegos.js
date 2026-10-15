// Rincón de juegos. Cada juego vive en su carpeta js/juegos/<modulo>/juego.js y se anota en data/juegos.json.
// Se carga recién cuando se toca, y si uno falla los demás siguen andando.
// Mientras data/juegos.json no tenga juegos, se muestra el paquete de semillas "próximamente".

import { cargar, t } from './datos.js';
import { crear, icono, plantilla } from './dom.js';

let lugar;
let juegos = [];
let limpiar = null;

function proximamente() {
  return crear('article', { class: 'paquete', 'aria-labelledby': 'paquete-titulo' },
    crear('span', { class: 'paquete__sello', 'aria-hidden': 'true', texto: t('juegos.proximamente.sello') }),
    plantilla('tpl-margarita'),
    crear('h2', { id: 'paquete-titulo', texto: t('juegos.proximamente.titulo') }),
    crear('p', { texto: t('juegos.proximamente.texto') }),
    crear('p', { class: 'manuscrita', texto: t('juegos.proximamente.nota') })
  );
}

function mostrarLista() {
  limpiar?.();
  limpiar = null;
  lugar.replaceChildren(
    crear('ul', { class: 'juegos-lista' },
      ...juegos.map((juego) =>
        crear('li', {},
          crear('button', { class: 'juego-tarjeta', type: 'button', onclick: () => abrir(juego) },
            crear('strong', { texto: juego.titulo }),
            juego.descripcion && crear('span', { texto: juego.descripcion }),
            crear('span', { class: 'manuscrita', 'aria-hidden': 'true', texto: `${t('juegos.jugar')} →` })
          )
        )
      )
    )
  );
}

async function abrir(juego) {
  const volver = crear('button', { class: 'juego-volver', type: 'button', onclick: mostrarLista },
    icono('ico-flecha'), t('juegos.volver'));
  const escenario = crear('div', { class: 'juego-escenario' });
  lugar.replaceChildren(volver, escenario);
  window.scrollTo(0, 0);

  try {
    const modulo = await import(`./juegos/${juego.modulo}/juego.js`);
    const datos = juego.datos ? await cargar(juego.datos) : null;
    limpiar = (await modulo.montar(escenario, { juego, datos, crear, t })) ?? null;
  } catch (error) {
    console.error(error);
    escenario.replaceChildren(crear('p', { class: 'vacio manuscrita', texto: t('juegos.error') }));
  }
  volver.focus({ preventScroll: true });
}

export async function montar(seccion) {
  ({ juegos = [] } = await cargar('juegos'));
  juegos = juegos.filter((juego) => juego.modulo);
  lugar = seccion.querySelector('[data-juegos]');

  if (!juegos.length) lugar.append(proximamente());
  else mostrarLista();
}
