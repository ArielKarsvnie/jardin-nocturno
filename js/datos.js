// Carga de los archivos de data/ y acceso a los textos de la interfaz.

const cache = new Map();

// Lee data/<nombre>.json una sola vez por visita.
// "no-cache" hace que el navegador pregunte si hubo cambios, así un JSON editado se ve al recargar.
export function cargar(nombre) {
  if (!cache.has(nombre)) {
    const pedido = fetch(`data/${nombre}.json`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`No pude leer data/${nombre}.json (${r.status})`);
      return r.json();
    });
    cache.set(nombre, pedido);
  }
  return cache.get(nombre);
}

let textos = {};

export async function cargarTextos() {
  textos = await cargar('textos');
}

function obtener(clave) {
  return clave.split('.').reduce((nodo, parte) => nodo?.[parte], textos);
}

function interpolar(texto, variables) {
  return texto.replace(/\{(\w+)\}/g, (_, k) => variables[k] ?? `{${k}}`);
}

// t('jardin.titulo') → texto de data/textos.json. Si falta, devuelve la clave para que se note.
export function t(clave, variables = {}) {
  const valor = obtener(clave);
  return typeof valor === 'string' ? interpolar(valor, variables) : clave;
}

// Para textos con singular y plural: { "uno": "...", "varios": "... {n} ..." }
export function tn(clave, n) {
  const valor = obtener(clave);
  if (!valor || typeof valor !== 'object') return clave;
  return interpolar(n === 1 ? valor.uno : valor.varios, { n });
}

// Rellena todos los elementos con data-texto="clave".
export function aplicarTextos(raiz = document) {
  for (const el of raiz.querySelectorAll('[data-texto]')) {
    el.textContent = t(el.dataset.texto);
  }
}
