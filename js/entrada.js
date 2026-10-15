// Entrada. En la Etapa 3 acá vive el mini-juego de la semilla; por ahora es un botón que lleva al jardín.

import { marcarSemillaPlantada, ir } from './estado.js';

export function montar(seccion) {
  seccion.querySelector('[data-accion="entrar"]').addEventListener('click', () => {
    marcarSemillaPlantada();
    ir('jardin');
  });
}
