// Ventanas (<dialog>) que se cierran con la X, tocando afuera, con Escape o con el "atrás" del celular.

const preparados = new WeakSet();

export function cerrarModal(dialogo) {
  // Si abrimos con una entrada en el historial, "atrás" la saca y el popstate cierra.
  if (history.state?.modal) history.back();
  else dialogo.close();
}

function preparar(dialogo) {
  if (preparados.has(dialogo)) return;
  preparados.add(dialogo);

  for (const boton of dialogo.querySelectorAll('[data-accion="cerrar"]')) {
    boton.addEventListener('click', () => cerrarModal(dialogo));
  }
  // Tocar el fondo oscuro cierra.
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) cerrarModal(dialogo);
  });
  // Escape pasa por el mismo camino que la X.
  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    cerrarModal(dialogo);
  });
  dialogo.addEventListener('close', () => document.documentElement.classList.remove('con-modal'));
  addEventListener('popstate', () => {
    if (dialogo.open) dialogo.close();
  });
}

export function abrirModal(dialogo) {
  preparar(dialogo);
  if (dialogo.open) return;
  dialogo.showModal();
  document.documentElement.classList.add('con-modal');
  history.pushState({ modal: true }, '');
}
