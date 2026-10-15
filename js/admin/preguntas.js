// Admin → Preguntas del juego de la semilla: agregar, editar, borrar y cambiar el orden.

import { leerJSON, modificarJSON } from './github.js';
import {
  $, vista, estado, esEjemplo, sinEjemplo, sinVacios, validar, limpiarErrores, publicando,
} from './ui.js';
import { crear } from '../dom.js';

const RUTA = 'data/semilla.json';
const MIN_OPCIONES = 2;
const MAX_OPCIONES = 5;

const formulario = $('[data-form-pregunta]');
const cajaOpciones = $('[data-opciones]', formulario);
let preguntas = [];
let editando = null; // { indice, pregunta } o null si es nueva

export async function abrir() {
  const { datos } = await leerJSON(RUTA);
  preguntas = datos.preguntas ?? [];
  pintarLista();
  vista('lista-preguntas');
}

// Antes de cambiar algo por su posición, confirma que en GitHub sigue siendo la misma pregunta.
function buscar(contenido, indice, original) {
  const lista = contenido.preguntas ?? [];
  if (lista[indice]?.pregunta !== original.pregunta) {
    throw new Error('Las preguntas cambiaron desde otro lado. Volvé a abrir la pestaña y probá de nuevo.');
  }
  return lista;
}

function pintarLista() {
  const lista = $('[data-vista="lista-preguntas"] [data-lista]');
  lista.replaceChildren(
    ...preguntas.map((pregunta, i) => {
      const correcta = pregunta.opciones?.find((o) => o.correcta)?.texto ?? '— sin respuesta correcta —';
      return crear('li', { class: 'admin-item' },
        crear('div', { class: 'admin-item__datos' },
          esEjemplo(pregunta) && crear('span', { class: 'admin-item__ejemplo', texto: 'de ejemplo' }),
          crear('strong', { texto: `${i + 1}. ${pregunta.pregunta || '(sin pregunta)'}` }),
          crear('span', { texto: `✓ ${correcta} · ${pregunta.opciones?.length ?? 0} opciones` })
        ),
        crear('div', { class: 'admin-item__acciones' },
          crear('button', { type: 'button', texto: 'Editar', onclick: () => abrirFormulario(i) }),
          crear('button', {
            type: 'button', class: 'admin-mover', 'aria-label': `Subir la pregunta ${i + 1}`, texto: '↑',
            disabled: i === 0, onclick: () => mover(i, -1),
          }),
          crear('button', {
            type: 'button', class: 'admin-mover', 'aria-label': `Bajar la pregunta ${i + 1}`, texto: '↓',
            disabled: i === preguntas.length - 1, onclick: () => mover(i, 1),
          }),
          crear('button', { type: 'button', class: 'peligro', texto: 'Borrar', onclick: () => borrar(i) })
        )
      );
    })
  );
  if (!preguntas.length) {
    lista.append(crear('li', { class: 'vacio manuscrita', texto: 'Sin preguntas, la planta florece directo. ¡Sumá alguna!' }));
  }
}

// ---------- Opciones dentro del formulario ----------

function filaOpcion(texto = '', correcta = false) {
  const fila = crear('div', { class: 'admin-opcion' },
    crear('label', { class: 'admin-opcion__correcta' },
      crear('input', { type: 'radio', name: 'correcta', checked: correcta }),
      crear('span', { class: 'visualmente-oculto', texto: 'Es la correcta' })
    ),
    crear('input', { type: 'text', name: 'opcion', value: texto, maxlength: '120', placeholder: 'Una opción', 'aria-label': 'Texto de la opción' }),
    crear('button', { type: 'button', class: 'admin-opcion__quitar', 'aria-label': 'Quitar esta opción', texto: '×' })
  );
  fila.querySelector('.admin-opcion__quitar').addEventListener('click', () => {
    fila.remove();
    actualizarBotonesOpciones();
  });
  // value como atributo no actualiza si el texto tiene caracteres raros: lo seteamos directo.
  fila.querySelector('[name="opcion"]').value = texto;
  return fila;
}

function actualizarBotonesOpciones() {
  const filas = cajaOpciones.querySelectorAll('.admin-opcion');
  for (const boton of cajaOpciones.querySelectorAll('.admin-opcion__quitar')) boton.disabled = filas.length <= MIN_OPCIONES;
  $('[data-accion="agregar-opcion"]', formulario).disabled = filas.length >= MAX_OPCIONES;
}

$('[data-accion="agregar-opcion"]', formulario).addEventListener('click', () => {
  const fila = filaOpcion();
  cajaOpciones.append(fila);
  actualizarBotonesOpciones();
  fila.querySelector('[name="opcion"]').focus();
});

function abrirFormulario(indice) {
  const pregunta = indice == null ? null : preguntas[indice];
  editando = pregunta ? { indice, pregunta } : null;
  formulario.reset();
  limpiarErrores(formulario);
  $('[data-titulo-form]', formulario.parentElement).textContent = pregunta ? `Editar pregunta ${indice + 1}` : 'Nueva pregunta';

  formulario.pregunta.value = sinEjemplo(pregunta?.pregunta);
  formulario.siAcierta.value = sinEjemplo(pregunta?.siAcierta);
  formulario.siFalla.value = sinEjemplo(pregunta?.siFalla);

  const opciones = pregunta?.opciones?.length ? pregunta.opciones : [{ correcta: true }, {}, {}];
  cajaOpciones.replaceChildren(...opciones.map((o) => filaOpcion(sinEjemplo(o.texto), Boolean(o.correcta))));
  actualizarBotonesOpciones();

  vista('form-pregunta');
  $('[data-titulo-form]', formulario.parentElement).focus({ preventScroll: true });
}

function leerOpciones() {
  return [...cajaOpciones.querySelectorAll('.admin-opcion')]
    .map((fila) => ({
      texto: fila.querySelector('[name="opcion"]').value.trim(),
      correcta: fila.querySelector('[name="correcta"]').checked,
      campo: fila.querySelector('[name="opcion"]'),
    }));
}

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  const opciones = leerOpciones();
  const conTexto = opciones.filter((o) => o.texto);
  const correcta = opciones.find((o) => o.correcta);
  const ok = validar(formulario, [
    [formulario.pregunta, 'Falta la pregunta.', !formulario.pregunta.value.trim()],
    [opciones.find((o) => !o.texto)?.campo ?? null, `Necesita al menos ${MIN_OPCIONES} opciones con texto.`, conTexto.length < MIN_OPCIONES],
    [null, 'Marcá cuál es la respuesta correcta (el círculo de la izquierda).', !correcta],
    [correcta?.campo ?? null, 'La respuesta correcta no tiene texto.', Boolean(correcta && !correcta.texto)],
  ]);
  if (!ok) return;

  publicando($('[type="submit"]', formulario), async () => {
    const nueva = sinVacios({
      pregunta: formulario.pregunta.value.trim(),
      opciones: conTexto.map((o) => (o.correcta ? { texto: o.texto, correcta: true } : { texto: o.texto })),
      siAcierta: formulario.siAcierta.value.trim(),
      siFalla: formulario.siFalla.value.trim(),
    });

    estado('Guardando la pregunta…');
    const datos = await modificarJSON(RUTA, (contenido) => {
      contenido.preguntas ??= [];
      if (editando) buscar(contenido, editando.indice, editando.pregunta)[editando.indice] = nueva;
      else contenido.preguntas.push(nueva);
    }, `Admin: ${editando ? 'editar' : 'nueva'} pregunta «${nueva.pregunta}»`);

    preguntas = datos.preguntas;
    pintarLista();
    vista('lista-preguntas');
    estado('¡Publicada! La próxima vez que juegue ya aparece.', 'ok');
  });
});

async function mover(indice, paso) {
  const original = preguntas[indice];
  try {
    estado('Cambiando el orden…');
    const datos = await modificarJSON(RUTA, (contenido) => {
      const lista = buscar(contenido, indice, original);
      const destino = indice + paso;
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    }, `Admin: mover pregunta «${original.pregunta}»`);
    preguntas = datos.preguntas;
    pintarLista();
    estado('Orden guardado.', 'ok');
    $(`[data-vista="lista-preguntas"] .admin-item:nth-child(${indice + paso + 1}) button`)?.focus();
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  }
}

async function borrar(indice) {
  const original = preguntas[indice];
  if (!confirm(`¿Borrar la pregunta «${original.pregunta}»?`)) return;
  try {
    estado('Borrando…');
    const datos = await modificarJSON(RUTA, (contenido) => {
      buscar(contenido, indice, original).splice(indice, 1);
    }, `Admin: borrar pregunta «${original.pregunta}»`);
    preguntas = datos.preguntas;
    pintarLista();
    estado('Pregunta borrada.', 'ok');
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  }
}

$('[data-vista="lista-preguntas"] [data-accion="nuevo"]').addEventListener('click', () => abrirFormulario(null));
