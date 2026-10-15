// Admin del jardín: agregar, editar y borrar recuerdos sin tocar código.
// Cada "Publicar" hace los commits en GitHub; la página se actualiza sola en 1 o 2 minutos.

import {
  REPO, leerToken, guardarToken, olvidarToken, probarToken,
  leerJSON, modificarJSON, guardarArchivo, borrarArchivo, shaSiExiste,
} from './github.js';
import { comprimir, blobABase64 } from './fotos.js';
import { crear } from '../dom.js';
import { formatearFecha } from '../fechas.js';
import { cargarFoto, rutasFoto } from '../rutas.js';

const RUTA_RECUERDOS = 'data/recuerdos.json';
const NOMBRES_FLOR = { margarita: 'margarita', jazmin: 'jazmín', aromo: 'aromo', calendula: 'caléndula' };

const $ = (sel) => document.querySelector(sel);
const formulario = $('[data-form-recuerdo]');

let recuerdos = [];
let editando = null; // el recuerdo que se está editando, o null si es nuevo
let fotoNueva = null; // resultado de comprimir(), si eligió una foto
let ocultarEstado;

// ---------- Utilidades de pantalla ----------

function vista(nombre) {
  for (const seccion of document.querySelectorAll('[data-vista]')) {
    seccion.hidden = seccion.dataset.vista !== nombre;
  }
  window.scrollTo(0, 0);
}

function estado(texto, tipo = 'info') {
  const caja = $('[data-estado]');
  clearTimeout(ocultarEstado);
  caja.textContent = texto;
  caja.className = `admin-estado admin-estado--${tipo}`;
  caja.hidden = false;
  if (tipo === 'ok') ocultarEstado = setTimeout(() => { caja.hidden = true; }, 7000);
}

function sinEstado() {
  $('[data-estado]').hidden = true;
}

function esEjemplo(recuerdo) {
  return Boolean(recuerdo._placeholder) || JSON.stringify(recuerdo).includes('[REEMPLAZAR]');
}

// "La Primera Cita!" → "la-primera-cita" (sin repetir uno existente)
function idPara(titulo) {
  const base = titulo
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 40) || 'recuerdo';
  let id = base;
  for (let n = 2; recuerdos.some((r) => r.id === id); n++) id = `${base}-${n}`;
  return id;
}

// ---------- Token ----------

async function entrar() {
  vista('cargando');
  try {
    await probarToken();
    await cargarRecuerdos();
    $('[data-repo]').textContent = `Publicando en github.com/${REPO.duenio}/${REPO.nombre}`
      + (REPO.local ? ' (ojo: aunque estés en localhost, los cambios se publican de verdad).' : '.');
    vista('lista');
  } catch (error) {
    if ([401, 403, 404].includes(error.status)) olvidarToken();
    vista(leerToken() ? 'lista' : 'candado');
    estado(error.message, 'error');
  }
}

$('[data-form-token]').addEventListener('submit', (e) => {
  e.preventDefault();
  const token = e.target.token.value.trim();
  if (!token) return;
  try {
    guardarToken(token);
  } catch (error) {
    estado(error.message, 'error');
    return;
  }
  e.target.reset();
  sinEstado();
  entrar();
});

$('[data-accion="olvidar"]').addEventListener('click', () => {
  olvidarToken();
  recuerdos = [];
  $('[data-lista]').replaceChildren();
  vista('candado');
  estado('Listo, este navegador ya no tiene el token.', 'ok');
});

// ---------- Lista ----------

async function cargarRecuerdos() {
  const { datos } = await leerJSON(RUTA_RECUERDOS);
  recuerdos = datos.recuerdos ?? [];
  pintarLista();
}

function pintarLista() {
  const ordenados = [...recuerdos].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  $('[data-lista]').replaceChildren(
    ...ordenados.map((recuerdo) => {
      const detalles = [
        formatearFecha(recuerdo.fecha) || 'sin fecha',
        recuerdo.flor ? NOMBRES_FLOR[recuerdo.flor] : 'flor automática',
        recuerdo.foto ? 'con foto' : 'sin foto',
      ].join(' · ');
      return crear('li', { class: 'admin-item' },
        crear('div', { class: 'admin-item__datos' },
          esEjemplo(recuerdo) && crear('span', { class: 'admin-item__ejemplo', texto: 'de ejemplo' }),
          crear('strong', { texto: recuerdo.titulo || '(sin título)' }),
          crear('span', { texto: detalles })
        ),
        crear('div', { class: 'admin-item__acciones' },
          crear('button', { type: 'button', texto: 'Editar', onclick: () => abrirFormulario(recuerdo) }),
          crear('button', { type: 'button', class: 'peligro', texto: 'Borrar', onclick: () => borrar(recuerdo) })
        )
      );
    })
  );
  if (!ordenados.length) {
    $('[data-lista]').append(crear('li', { class: 'vacio manuscrita', texto: 'Todavía no hay recuerdos. ¡Sumá el primero!' }));
  }
}

$('[data-accion="nuevo"]').addEventListener('click', () => abrirFormulario(null));
$('[data-accion="volver"]').addEventListener('click', () => {
  sinEstado();
  vista('lista');
});

// ---------- Formulario ----------

// Cada vez una <img> nueva, así no se acumulan los avisos de "no cargó" de fotos anteriores.
function nuevaVistaPrevia() {
  const img = crear('img', { 'data-vista-previa': '', alt: '', hidden: true });
  $('[data-vista-previa]').replaceWith(img);
  return img;
}

function mostrarFoto(src, info) {
  const img = nuevaVistaPrevia();
  img.hidden = !src;
  if (src) img.src = src;
  $('[data-foto-info]').textContent = info;
  $('[data-foto-boton]').textContent = src ? 'Cambiar foto' : 'Elegir foto';
}

function abrirFormulario(recuerdo) {
  editando = recuerdo;
  fotoNueva = null;
  formulario.reset();
  $('[data-error-form]').hidden = true;
  for (const campo of formulario.querySelectorAll('[aria-invalid]')) campo.removeAttribute('aria-invalid');

  $('[data-titulo-form]').textContent = recuerdo ? 'Editar recuerdo' : 'Nuevo recuerdo';
  if (recuerdo) {
    const limpio = (valor) => (String(valor ?? '').includes('[REEMPLAZAR]') ? '' : valor ?? '');
    formulario.titulo.value = limpio(recuerdo.titulo);
    formulario.fecha.value = recuerdo.fecha ?? '';
    formulario.alt.value = limpio(recuerdo.alt);
    formulario.texto.value = limpio(Array.isArray(recuerdo.texto) ? recuerdo.texto.join('\n\n') : recuerdo.texto);
    formulario.pie.value = limpio(recuerdo.pie);
    formulario.flor.value = recuerdo.flor ?? '';
  }

  mostrarFoto(null, 'Sin foto: se va a ver un dibujo de flor.');
  if (recuerdo?.foto) {
    const img = nuevaVistaPrevia();
    img.hidden = false;
    $('[data-foto-info]').textContent = 'Foto actual. Elegí otra si la querés cambiar.';
    $('[data-foto-boton]').textContent = 'Cambiar foto';
    cargarFoto(img, recuerdo.foto, () => {
      img.hidden = true;
      $('[data-foto-info]').textContent = `La foto "${recuerdo.foto}" todavía no está publicada. Podés elegir una acá.`;
    });
  }

  vista('formulario');
  $('[data-titulo-form]').focus({ preventScroll: true });
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

function validar() {
  const errores = [];
  for (const [nombre, mensaje] of [['titulo', 'Falta el título.'], ['fecha', 'Falta la fecha.']]) {
    const campo = formulario[nombre];
    const mal = !campo.value.trim();
    if (mal) {
      campo.setAttribute('aria-invalid', 'true');
      errores.push(mensaje);
    } else {
      campo.removeAttribute('aria-invalid');
    }
  }
  const caja = $('[data-error-form]');
  caja.textContent = errores.join(' ');
  caja.hidden = !errores.length;
  if (errores.length) formulario.querySelector('[aria-invalid]')?.focus();
  return !errores.length;
}

function leerFormulario(id, foto) {
  const parrafos = formulario.texto.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const recuerdo = {
    id,
    titulo: formulario.titulo.value.trim(),
    fecha: formulario.fecha.value,
    foto,
    alt: formulario.alt.value.trim(),
    texto: parrafos.length > 1 ? parrafos : parrafos[0] ?? '',
    pie: formulario.pie.value.trim(),
    flor: formulario.flor.value,
  };
  // Sin campos vacíos en el JSON
  for (const [clave, valor] of Object.entries(recuerdo)) if (valor === '') delete recuerdo[clave];
  return recuerdo;
}

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validar()) return;

  const boton = $('[data-publicar]');
  boton.disabled = true;
  const titulo = formulario.titulo.value.trim();
  const id = editando?.id ?? idPara(titulo);
  let foto = editando?.foto ?? '';

  try {
    if (fotoNueva) {
      estado('Subiendo la foto…');
      const nombre = `${id}.${fotoNueva.extension}`;
      const ruta = `assets/fotos/${nombre}`;
      await guardarArchivo(ruta, await blobABase64(fotoNueva.blob), `Admin: foto de «${titulo}»`, await shaSiExiste(ruta));
      foto = nombre;
    }

    estado('Guardando el recuerdo…');
    const nuevo = leerFormulario(id, foto);
    const datos = await modificarJSON(RUTA_RECUERDOS, (contenido) => {
      contenido.recuerdos ??= [];
      const i = contenido.recuerdos.findIndex((r) => r.id === id);
      if (i >= 0) contenido.recuerdos[i] = nuevo;
      else contenido.recuerdos.push(nuevo);
    }, `Admin: ${editando ? 'editar' : 'nuevo'} recuerdo «${titulo}»`);

    recuerdos = datos.recuerdos;
    pintarLista();
    vista('lista');
    estado(`¡Publicado! «${titulo}» aparece en el jardín en 1 o 2 minutos.`, 'ok');
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
});

// ---------- Borrar ----------

async function borrar(recuerdo) {
  const seguro = confirm(`¿Borrar «${recuerdo.titulo}»?\n\nDesaparece del jardín (queda guardado en el historial de GitHub).`);
  if (!seguro) return;

  try {
    estado('Borrando…');
    const datos = await modificarJSON(RUTA_RECUERDOS, (contenido) => {
      contenido.recuerdos = (contenido.recuerdos ?? []).filter((r) => r.id !== recuerdo.id);
    }, `Admin: borrar recuerdo «${recuerdo.titulo}»`);
    recuerdos = datos.recuerdos;
    pintarLista();

    // Borra también la foto publicada, si ningún otro recuerdo la usa.
    if (recuerdo.foto && !recuerdos.some((r) => r.foto === recuerdo.foto)) {
      for (const url of rutasFoto(recuerdo.foto)) {
        const sha = await shaSiExiste(url);
        if (sha) await borrarArchivo(url, `Admin: borrar foto de «${recuerdo.titulo}»`, sha);
      }
    }
    estado(`«${recuerdo.titulo}» ya no está en el jardín.`, 'ok');
  } catch (error) {
    console.error(error);
    estado(error.message, 'error');
  }
}

// ---------- Arranque ----------

document.documentElement.classList.add('listo');
if (leerToken()) entrar();
else vista('candado');
