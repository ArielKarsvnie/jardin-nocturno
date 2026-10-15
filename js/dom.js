// Ayudantes chiquitos para armar HTML sin usar innerHTML.

// crear('p', { class: 'nota', texto: 'Hola' }, hijo1, hijo2)
export function crear(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor == null || valor === false) continue;
    if (clave === 'class') el.className = valor;
    else if (clave === 'texto') el.textContent = valor;
    else if (clave.startsWith('on')) el.addEventListener(clave.slice(2), valor);
    else el.setAttribute(clave, valor === true ? '' : valor);
  }
  el.append(...hijos.filter((h) => h != null && h !== false));
  return el;
}

// Clona el primer elemento de un <template id="...">.
export function plantilla(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

// Ícono del sprite de index.html: icono('ico-sobre')
export function icono(id, viewBox = '0 0 24 24') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}
