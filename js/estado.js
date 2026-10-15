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

// Recuerdos que ya vio, para marcar con "¡nueva!" las flores que se agreguen después.
const CLAVE_VISTOS = 'jardin-nocturno:recuerdos-vistos';

function leerVistos() {
  try {
    const vistos = JSON.parse(localStorage.getItem(CLAVE_VISTOS));
    return Array.isArray(vistos) ? vistos : null;
  } catch {
    return null;
  }
}

function guardarVistos(ids) {
  try {
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify(ids));
  } catch {
    // Sin almacenamiento simplemente no hay flores "nuevas".
  }
}

// La primera visita no marca nada como nuevo: todo el jardín es nuevo.
export function recuerdosNuevos(ids) {
  const vistos = leerVistos();
  if (!vistos) {
    guardarVistos(ids);
    return new Set();
  }
  return new Set(ids.filter((id) => !vistos.includes(id)));
}

export function marcarRecuerdoVisto(id) {
  const vistos = leerVistos() ?? [];
  if (!vistos.includes(id)) guardarVistos([...vistos, id]);
}

export function ir(seccion) {
  location.hash = seccion;
}
