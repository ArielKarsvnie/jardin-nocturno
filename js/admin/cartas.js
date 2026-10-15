// Admin → Cartas: cartas selladas que se abren en una fecha (hora de Argentina).

import { leerJSON, modificarJSON } from './github.js';
import {
  $, vista, estado, esEjemplo, sinEjemplo, idUnico, aParrafos, sinVacios,
  validar, limpiarErrores, publicando,
} from './ui.js';
import { crear } from '../dom.js';
import { formatearFecha } from '../fechas.js';

const RUTA = 'data/cartas.json';
const formulario = $('[data-form-carta]');
let cartas = [];
let editando = null;

// "2026-11-09T00:00:00-03:00" ↔ fecha "2026-11-09" + hora "00:00"
function separarAbre(abre = '') {
  const [, fecha = '', hora = '00:00'] = abre.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/) ?? [];
  return { fecha, hora };
}

const unirAbre = (fecha, hora) => `${fecha}T${hora || '00:00'}:00-03:00`;

export async function abrir() {
  const { datos } = await leerJSON(RUTA);
  cartas = datos.cartas ?? [];
  pintarLista();
  vista('lista-cartas');
}

function pintarLista() {
  const lista = $('[data-vista="lista-cartas"] [data-lista]');
  const ordenadas = [...cartas].sort((a, b) => (a.abre ?? '').localeCompare(b.abre ?? ''));
  lista.replaceChildren(
    ...ordenadas.map((carta) => {
      const abierta = Date.parse(carta.abre) <= Date.now();
      return crear('li', { class: 'admin-item' },
        crear('div', { class: 'admin-item__datos' },
          esEjemplo(carta) && crear('span', { class: 'admin-item__ejemplo', texto: 'de ejemplo' }),
          crear('strong', { texto: carta.titulo || '(sin título)' }),
          crear('span', {
            texto: abierta
              ? `Abierta desde el ${formatearFecha(carta.abre, 'conHora')}`
              : `Cerrada · se abre el ${formatearFecha(carta.abre, 'conHora')}`,
          })
        ),
        crear('div', { class: 'admin-item__acciones' },
          crear('button', { type: 'button', texto: 'Editar', onclick: () => abrirFormulario(carta) }),
          crear('button', { type: 'button', class: 'peligro', texto: 'Borrar', onclick: () => borrar(carta) })
        )
      );
    })
  );
  if (!ordenadas.length) lista.append(crear('li', { class: 'vacio manuscrita', texto: 'Todavía no hay cartas.' }));
}

function abrirFormulario(carta) {
  editando = carta;
  formulario.reset();
  limpiarErrores(formulario);
  $('[data-titulo-form]', formulario.parentElement).textContent = carta ? 'Editar carta' : 'Nueva carta';

  if (carta) {
    const { fecha, hora } = separarAbre(carta.abre);
    formulario.titulo.value = sinEjemplo(carta.titulo);
    formulario.fecha.value = fecha;
    formulario.hora.value = hora;
    formulario.candado.value = sinEjemplo(carta.candado);
    formulario.texto.value = sinEjemplo(carta.texto);
    formulario.firma.value = carta.firma ?? '';
  }

  vista('form-carta');
  $('[data-titulo-form]', formulario.parentElement).focus({ preventScroll: true });
}

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = validar(formulario, [
    [formulario.titulo, 'Falta el título.', !formulario.titulo.value.trim()],
    [formulario.fecha, 'Falta la fecha en que se abre.', !formulario.fecha.value],
    [formulario.texto, 'Falta el texto de la carta.', !formulario.texto.value.trim()],
  ]);
  if (!ok) return;

  publicando($('[type="submit"]', formulario), async () => {
    const titulo = formulario.titulo.value.trim();
    const id = editando?.id ?? idUnico(titulo, cartas.map((c) => c.id), 'carta');
    const nueva = sinVacios({
      id,
      titulo,
      abre: unirAbre(formulario.fecha.value, formulario.hora.value),
      candado: formulario.candado.value.trim(),
      texto: aParrafos(formulario.texto.value),
      firma: formulario.firma.value.trim(),
    });

    estado('Guardando la carta…');
    const datos = await modificarJSON(RUTA, (contenido) => {
      contenido.cartas ??= [];
      const i = contenido.cartas.findIndex((c) => c.id === id);
      if (i >= 0) contenido.cartas[i] = nueva;
      else contenido.cartas.push(nueva);
    }, `Admin: ${editando ? 'editar' : 'nueva'} carta «${titulo}»`);

    cartas = datos.cartas;
    pintarLista();
    vista('lista-cartas');
    estado(`¡Publicada! «${titulo}» se abre el ${formatearFecha(nueva.abre, 'conHora')}.`, 'ok');
  });
});

async function borrar(carta) {
  if (!confirm(`¿Borrar la carta «${carta.titulo}»?\n\nDesaparece de la página (queda en el historial de GitHub).`)) return;
  try {
    estado('Borrando…');
    const datos = await modificarJSON(RUTA, (contenido) => {
      contenido.cartas = (contenido.cartas ?? []).filter((c) => c.id !== carta.id);
    }, `Admin: borrar carta «${carta.titulo}»`);
    cartas = datos.cartas;
    pintarLista();
    estado(`La carta «${carta.titulo}» ya no está.`, 'ok');
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  }
}

$('[data-vista="lista-cartas"] [data-accion="nuevo"]').addEventListener('click', () => abrirFormulario(null));
