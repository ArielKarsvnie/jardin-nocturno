// Admin → Recuerdos: agregar, editar y borrar flores del jardín (con foto).

import { leerJSON, modificarJSON, guardarArchivo, borrarArchivo, shaSiExiste } from './github.js';
import { comprimir, blobABase64 } from './fotos.js';
import {
  $, vista, estado, sinEstado, esEjemplo, sinEjemplo, idUnico, aParrafos, sinVacios,
  validar, limpiarErrores, publicando,
} from './ui.js';
import { crear } from '../dom.js';
import { formatearFecha } from '../fechas.js';
import { cargarFoto, rutasFoto } from '../rutas.js';

const RUTA = 'data/recuerdos.json';
const NOMBRES_FLOR = { margarita: 'margarita', jazmin: 'jazmín', aromo: 'aromo', calendula: 'caléndula' };

const formulario = $('[data-form-recuerdo]');
let recuerdos = [];
let editando = null;
let fotoNueva = null;

export async function abrir() {
  const { datos } = await leerJSON(RUTA);
  recuerdos = datos.recuerdos ?? [];
  pintarLista();
  vista('lista-recuerdos');
}

function pintarLista() {
  const lista = $('[data-vista="lista-recuerdos"] [data-lista]');
  const ordenados = [...recuerdos].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  lista.replaceChildren(
    ...ordenados.map((recuerdo) =>
      crear('li', { class: 'admin-item' },
        crear('div', { class: 'admin-item__datos' },
          esEjemplo(recuerdo) && crear('span', { class: 'admin-item__ejemplo', texto: 'de ejemplo' }),
          crear('strong', { texto: recuerdo.titulo || '(sin título)' }),
          crear('span', {
            texto: [
              formatearFecha(recuerdo.fecha) || 'sin fecha',
              recuerdo.flor ? NOMBRES_FLOR[recuerdo.flor] : 'flor automática',
              recuerdo.foto ? 'con foto' : 'sin foto',
            ].join(' · '),
          })
        ),
        crear('div', { class: 'admin-item__acciones' },
          crear('button', { type: 'button', texto: 'Editar', onclick: () => abrirFormulario(recuerdo) }),
          crear('button', { type: 'button', class: 'peligro', texto: 'Borrar', onclick: () => borrar(recuerdo) })
        )
      )
    )
  );
  if (!ordenados.length) lista.append(crear('li', { class: 'vacio manuscrita', texto: 'Todavía no hay recuerdos. ¡Sumá el primero!' }));
}

// ---------- Formulario ----------

// Cada vez una <img> nueva, así no se acumulan los avisos de "no cargó" de fotos anteriores.
function nuevaVistaPrevia() {
  const img = crear('img', { 'data-vista-previa': '', alt: '', hidden: true });
  $('[data-vista-previa]', formulario).replaceWith(img);
  return img;
}

function mostrarFoto(src, info) {
  const img = nuevaVistaPrevia();
  img.hidden = !src;
  if (src) img.src = src;
  $('[data-foto-info]', formulario).textContent = info;
  $('[data-foto-boton]', formulario).textContent = src ? 'Cambiar foto' : 'Elegir foto';
}

function abrirFormulario(recuerdo) {
  editando = recuerdo;
  fotoNueva = null;
  formulario.reset();
  limpiarErrores(formulario);
  $('[data-titulo-form]', formulario.parentElement).textContent = recuerdo ? 'Editar recuerdo' : 'Nuevo recuerdo';

  if (recuerdo) {
    formulario.titulo.value = sinEjemplo(recuerdo.titulo);
    formulario.fecha.value = recuerdo.fecha ?? '';
    formulario.alt.value = sinEjemplo(recuerdo.alt);
    formulario.texto.value = sinEjemplo(recuerdo.texto);
    formulario.pie.value = sinEjemplo(recuerdo.pie);
    formulario.flor.value = recuerdo.flor ?? '';
  }

  mostrarFoto(null, 'Sin foto: se va a ver un dibujo de flor.');
  if (recuerdo?.foto) {
    const img = nuevaVistaPrevia();
    img.hidden = false;
    $('[data-foto-info]', formulario).textContent = 'Foto actual. Elegí otra si la querés cambiar.';
    $('[data-foto-boton]', formulario).textContent = 'Cambiar foto';
    cargarFoto(img, recuerdo.foto, () => {
      img.hidden = true;
      $('[data-foto-info]', formulario).textContent = `La foto "${recuerdo.foto}" todavía no está publicada. Podés elegir una acá.`;
    });
  }

  vista('form-recuerdo');
  $('[data-titulo-form]', formulario.parentElement).focus({ preventScroll: true });
}

formulario.foto.addEventListener('change', async () => {
  const archivo = formulario.foto.files[0];
  if (!archivo) return;
  estado('Achicando la foto…');
  try {
    fotoNueva = await comprimir(archivo);
    mostrarFoto(
      URL.createObjectURL(fotoNueva.blob),
      `${fotoNueva.antesKB} KB → ${fotoNueva.despuesKB} KB · ${fotoNueva.ancho}×${fotoNueva.alto} · sin datos de ubicación`
    );
    sinEstado();
  } catch (error) {
    fotoNueva = null;
    formulario.foto.value = '';
    estado(error.message, 'error');
  }
});

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = validar(formulario, [
    [formulario.titulo, 'Falta el título.', !formulario.titulo.value.trim()],
    [formulario.fecha, 'Falta la fecha.', !formulario.fecha.value],
  ]);
  if (!ok) return;

  publicando($('[type="submit"]', formulario), async () => {
    const titulo = formulario.titulo.value.trim();
    const id = editando?.id ?? idUnico(titulo, recuerdos.map((r) => r.id), 'recuerdo');
    let foto = editando?.foto ?? '';

    if (fotoNueva) {
      estado('Subiendo la foto…');
      const nombre = `${id}.${fotoNueva.extension}`;
      const ruta = `assets/fotos/${nombre}`;
      await guardarArchivo(ruta, await blobABase64(fotoNueva.blob), `Admin: foto de «${titulo}»`, await shaSiExiste(ruta));
      foto = nombre;
    }

    estado('Guardando el recuerdo…');
    const parrafos = aParrafos(formulario.texto.value);
    const nuevo = sinVacios({
      id,
      titulo,
      fecha: formulario.fecha.value,
      foto,
      alt: formulario.alt.value.trim(),
      texto: parrafos.length > 1 ? parrafos : parrafos[0] ?? '',
      pie: formulario.pie.value.trim(),
      flor: formulario.flor.value,
    });
    const datos = await modificarJSON(RUTA, (contenido) => {
      contenido.recuerdos ??= [];
      const i = contenido.recuerdos.findIndex((r) => r.id === id);
      if (i >= 0) contenido.recuerdos[i] = nuevo;
      else contenido.recuerdos.push(nuevo);
    }, `Admin: ${editando ? 'editar' : 'nuevo'} recuerdo «${titulo}»`);

    recuerdos = datos.recuerdos;
    pintarLista();
    vista('lista-recuerdos');
    estado(`¡Publicado! «${titulo}» aparece en el jardín en 1 o 2 minutos.`, 'ok');
  });
});

// ---------- Borrar ----------

async function borrar(recuerdo) {
  if (!confirm(`¿Borrar «${recuerdo.titulo}»?\n\nDesaparece del jardín (queda guardado en el historial de GitHub).`)) return;
  try {
    estado('Borrando…');
    const datos = await modificarJSON(RUTA, (contenido) => {
      contenido.recuerdos = (contenido.recuerdos ?? []).filter((r) => r.id !== recuerdo.id);
    }, `Admin: borrar recuerdo «${recuerdo.titulo}»`);
    recuerdos = datos.recuerdos;
    pintarLista();

    // Borra también la foto publicada, si ningún otro recuerdo la usa.
    if (recuerdo.foto && !recuerdos.some((r) => r.foto === recuerdo.foto)) {
      for (const ruta of rutasFoto(recuerdo.foto)) {
        const sha = await shaSiExiste(ruta);
        if (sha) await borrarArchivo(ruta, `Admin: borrar foto de «${recuerdo.titulo}»`, sha);
      }
    }
    estado(`«${recuerdo.titulo}» ya no está en el jardín.`, 'ok');
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  }
}

$('[data-vista="lista-recuerdos"] [data-accion="nuevo"]').addEventListener('click', () => abrirFormulario(null));
