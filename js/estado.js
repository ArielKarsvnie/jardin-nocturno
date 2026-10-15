// Lo que la página recuerda entre visitas (solo en este celular).
// Si el almacenamiento está bloqueado (modo incógnito, etc.) todo sigue andando, solo se olvida.

const CLAVE_SEMILLA = 'jardin-nocturno:semilla-plantada';
const CLAVE_VISTOS = 'jardin-nocturno:recuerdos-vistos';
const CLAVE_CARTAS = 'jardin-nocturno:cartas-leidas';

function leerLista(clave) {
  try {
    const lista = JSON.parse(localStorage.getItem(clave));
    return Array.isArray(lista) ? lista : null;
  } catch {
    return null;
  }
}

function guardarLista(clave, lista) {
  try {
    localStorage.setItem(clave, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento no hay "nuevas", y no pasa nada.
  }
}

function agregarALista(clave, id) {
  const lista = leerLista(clave) ?? [];
  if (!lista.includes(id)) guardarLista(clave, [...lista, id]);
}

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
    // La próxima vez vuelve a ver la entrada completa.
  }
}

// Recuerdos: la primera visita no marca nada como nuevo (todo el jardín es nuevo).
export function recuerdosNuevos(ids) {
  const vistos = leerLista(CLAVE_VISTOS);
  if (!vistos) {
    guardarLista(CLAVE_VISTOS, ids);
    return new Set();
  }
  return new Set(ids.filter((id) => !vistos.includes(id)));
}

export function marcarRecuerdoVisto(id) {
  agregarALista(CLAVE_VISTOS, id);
}

// Cartas: una carta abierta que todavía no leyó lleva "¡nueva!".
export function cartaLeida(id) {
  return (leerLista(CLAVE_CARTAS) ?? []).includes(id);
}

export function marcarCartaLeida(id) {
  agregarALista(CLAVE_CARTAS, id);
}

export function ir(seccion) {
  location.hash = seccion;
}
