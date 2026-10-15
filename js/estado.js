// Lo que la página recuerda entre visitas (solo en este celular).

const CLAVE_SEMILLA = 'jardin-nocturno:semilla-plantada';

export function yaPlantoLaSemilla() {
  try {
    return localStorage.getItem(CLAVE_SEMILLA) === '1';
  } catch {
    return false;
  }
}

export function marcarSemillaPlantada() {
  try {
    localStorage.setItem(CLAVE_SEMILLA, '1');
  } catch {
    // Modo incógnito o almacenamiento bloqueado: la próxima vez vuelve a ver la entrada, no pasa nada.
  }
}

export function ir(seccion) {
  location.hash = seccion;
}
