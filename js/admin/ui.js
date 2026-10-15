// Piezas compartidas por todas las secciones del admin.

export const $ = (selector, raiz = document) => raiz.querySelector(selector);

let ocultarEstado;

// Muestra una sola pantalla. Las pestañas y el pie solo se ven en las listas.
export function vista(nombre) {
  for (const seccion of document.querySelectorAll('[data-vista]')) {
    seccion.hidden = seccion.dataset.vista !== nombre;
  }
  const enLista = nombre.startsWith('lista-');
  $('[data-pestanas]').hidden = !enLista;
  $('[data-pie-admin]').hidden = !enLista;
  window.scrollTo(0, 0);
}

export function estado(texto, tipo = 'info') {
  const caja = $('[data-estado]');
  clearTimeout(ocultarEstado);
  caja.textContent = texto;
  caja.className = `admin-estado admin-estado--${tipo}`;
  caja.hidden = false;
  if (tipo === 'ok') ocultarEstado = setTimeout(() => { caja.hidden = true; }, 7000);
}

export function sinEstado() {
  $('[data-estado]').hidden = true;
}

export function esEjemplo(item) {
  return Boolean(item._placeholder) || JSON.stringify(item).includes('[REEMPLAZAR]');
}

// Al editar, los textos de ejemplo aparecen vacíos para escribir encima.
export function sinEjemplo(valor) {
  const texto = Array.isArray(valor) ? valor.join('\n\n') : String(valor ?? '');
  return texto.includes('[REEMPLAZAR]') ? '' : texto;
}

// "La Primera Cita!" → "la-primera-cita", sin repetir ninguno de los existentes.
export function idUnico(texto, existentes, base = 'item') {
  const limpio = texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 40) || base;
  let id = limpio;
  for (let n = 2; existentes.includes(id); n++) id = `${limpio}-${n}`;
  return id;
}

// Texto con líneas en blanco → lista de párrafos.
export function aParrafos(texto) {
  return texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function sinVacios(objeto) {
  for (const [clave, valor] of Object.entries(objeto)) {
    if (valor === '' || valor == null || (Array.isArray(valor) && !valor.length)) delete objeto[clave];
  }
  return objeto;
}

// Revisa los campos obligatorios y muestra los errores en [data-error] del formulario.
// reglas: [[campo o null, mensaje, estaMal]]
export function validar(formulario, reglas) {
  const errores = [];
  for (const campo of formulario.querySelectorAll('[aria-invalid]')) campo.removeAttribute('aria-invalid');
  for (const [campo, mensaje, estaMal] of reglas) {
    if (!estaMal) continue;
    errores.push(mensaje);
    campo?.setAttribute('aria-invalid', 'true');
  }
  const caja = $('[data-error]', formulario);
  caja.textContent = errores.join(' ');
  caja.hidden = !errores.length;
  if (errores.length) (formulario.querySelector('[aria-invalid]') ?? caja).focus?.();
  return !errores.length;
}

export function limpiarErrores(formulario) {
  for (const campo of formulario.querySelectorAll('[aria-invalid]')) campo.removeAttribute('aria-invalid');
  $('[data-error]', formulario).hidden = true;
}

// Deshabilita el botón mientras se publica y muestra el error si algo falla.
export async function publicando(boton, tarea) {
  boton.disabled = true;
  try {
    await tarea();
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
}
