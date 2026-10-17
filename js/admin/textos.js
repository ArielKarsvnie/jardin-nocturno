// Admin → Textos: todos los textos de la página (data/textos.json) y la canción (data/musica.json).
// Se arma solo a partir del JSON: si mañana se agrega un texto nuevo, aparece acá sin tocar este archivo.
// Al guardar, solo se escriben los campos que cambiaste, encima de la versión más nueva.

import { leerJSON, modificarJSON } from './github.js';
import { $, vista, estado, publicando } from './ui.js';
import { crear } from '../dom.js';

const RUTA_TEXTOS = 'data/textos.json';
const RUTA_MUSICA = 'data/musica.json';

const GRUPOS = {
  sitio: 'General',
  nav: 'Menú de abajo',
  entrada: 'Entrada (bienvenida)',
  semilla: 'Juego de la semilla',
  jardin: 'Jardín',
  tarjeta: 'Tarjeta de un recuerdo',
  cartas: 'Cartas',
  musica: 'Botón de música',
  juegos: 'Rincón de juegos',
};

// Nombres amigables. Lo que no esté acá se muestra con su nombre técnico.
const ETIQUETAS = {
  'sitio.titulo': 'Nombre arriba a la izquierda',
  'sitio.pie': 'Firma al pie de la página',
  'nav.jardin': 'Botón "Jardín"',
  'nav.cartas': 'Botón "Cartas"',
  'nav.juegos': 'Botón "Juegos"',
  'entrada.saludo': 'Saludo (la primera vez)',
  'entrada.saludoVuelta': 'Saludo (cuando vuelve)',
  'entrada.titulo': 'Título',
  'entrada.texto': 'Texto (la primera vez)',
  'entrada.textoVuelta': 'Texto (cuando vuelve)',
  'entrada.boton': 'Botón para empezar el juego',
  'entrada.nota': 'Nota chiquita debajo del botón',
  'entrada.entrarDirecto': 'Botón "entrar directo"',
  'entrada.jugarDeNuevo': 'Botón "jugar de nuevo"',
  'semilla.progreso': 'Contador de preguntas',
  'semilla.siguiente': 'Botón para pasar de pregunta',
  'semilla.verQueBroto': 'Botón después de la última pregunta',
  'semilla.bienGenerico': 'Si acierta (cuando la pregunta no tiene reacción propia)',
  'semilla.malGenerico': 'Si se equivoca (cuando la pregunta no tiene reacción propia)',
  'semilla.final.titulo': 'Título cuando florece',
  'semilla.final.todas': 'Puntaje: todas bien',
  'semilla.final.algunas': 'Puntaje: algunas bien',
  'semilla.final.ninguna': 'Puntaje: ninguna bien',
  'semilla.final.sinPreguntas': 'Si no hay preguntas cargadas',
  'semilla.final.boton': 'Botón para entrar al jardín',
  'jardin.titulo': 'Título',
  'jardin.bajada': 'Texto debajo del título',
  'jardin.contador': 'Contador de flores',
  'jardin.nueva': 'Cartel de flor nueva',
  'jardin.vacio': 'Si todavía no hay recuerdos',
  'tarjeta.cerrar': 'Botón cerrar (lo lee el lector de pantalla)',
  'tarjeta.anterior': 'Flecha anterior (lo lee el lector de pantalla)',
  'tarjeta.siguiente': 'Flecha siguiente (lo lee el lector de pantalla)',
  'tarjeta.posicion': 'Contador "1 de 3"',
  'tarjeta.fotoPendiente': 'Si falta la foto',
  'cartas.titulo': 'Título',
  'cartas.bajada': 'Texto debajo del título',
  'cartas.cerrada': 'Estado "cerrada"',
  'cartas.abre': 'Cuándo se abre',
  'cartas.falta.dias': 'Cuenta regresiva en días',
  'cartas.falta.horas': 'Cuenta regresiva en horas',
  'cartas.falta.minutos': 'Cuenta regresiva en minutos',
  'cartas.falta.segundos': 'Cuenta regresiva en segundos',
  'cartas.leer': 'Debajo de una carta abierta sin leer',
  'cartas.releer': 'Debajo de una carta ya leída',
  'cartas.nueva': 'Cartel de carta nueva',
  'cartas.candadoGenerico': 'Candado (si la carta no tiene uno propio)',
  'cartas.insistencia': 'Chistes si insiste en abrir una carta cerrada',
  'cartas.recienAbierta': 'Cuando una carta se abre con la página abierta',
  'cartas.vacio': 'Si todavía no hay cartas',
  'cartas.cerrar': 'Botón cerrar carta (lo lee el lector de pantalla)',
  'musica.poner': 'Botón de música: poner (lector de pantalla)',
  'musica.pausar': 'Botón de música: pausar (lector de pantalla)',
  'musica.reproductor': 'Nombre del reproductor (lector de pantalla)',
  'musica.ocultar': 'Botón ocultar reproductor (lector de pantalla)',
  'musica.ayuda': 'Si el celular no deja arrancar la música',
  'musica.error': 'Si Spotify no carga',
  'musica.nota': 'Nota sobre los 30 segundos',
  'juegos.titulo': 'Título',
  'juegos.bajada': 'Texto debajo del título',
  'juegos.proximamente.sello': 'Sello redondo',
  'juegos.proximamente.titulo': 'Título del cartel',
  'juegos.proximamente.texto': 'Texto del cartel',
  'juegos.proximamente.nota': 'Nota manuscrita del cartel',
  'juegos.jugar': 'Botón "jugar"',
  'juegos.volver': 'Botón para volver a la lista',
  'juegos.error': 'Si un juego se rompe',
};

const AYUDA_VARIABLES = {
  n: 'el número',
  i: 'el número de pregunta o recuerdo',
  b: 'las respuestas correctas',
  h: 'las horas',
  m: 'los minutos',
  fecha: 'la fecha',
};

let textos = {};
let musica = {};
let campos = []; // { ruta, tipo, original, leer(), elemento }
let camposMusica = {};

const lugar = () => $('[data-vista="lista-textos"] [data-textos]');

// ---------- Ayudantes ----------

const esPlural = (valor) => valor && typeof valor === 'object' && !Array.isArray(valor)
  && Object.keys(valor).sort().join() === 'uno,varios';

const variablesDe = (texto) => new Set([...String(texto).matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

function poner(objeto, ruta, valor) {
  const partes = ruta.split('.');
  const ultima = partes.pop();
  let nodo = objeto;
  for (const parte of partes) nodo = nodo[parte] ??= {};
  nodo[ultima] = valor;
}

function caja(valor, etiqueta) {
  const largo = valor.length > 45 || valor.includes('\n');
  const campo = largo
    ? crear('textarea', { rows: String(Math.min(5, Math.ceil(valor.length / 34) + 1)), 'aria-label': etiqueta })
    : crear('input', { type: 'text', 'aria-label': etiqueta });
  campo.value = valor;
  return campo;
}

function ayudaVariables(original) {
  const variables = [...variablesDe(JSON.stringify(original))];
  if (!variables.length) return null;
  const texto = variables.map((v) => `{${v}} = ${AYUDA_VARIABLES[v] ?? v}`).join(' · ');
  return crear('small', { class: 'admin-variables', texto: `Se reemplaza solo: ${texto}` });
}

// ---------- Campos ----------

function campoTexto(ruta, valor, etiqueta) {
  const entrada = caja(valor, etiqueta);
  return { elemento: entrada, leer: () => entrada.value.trim(), entradas: [entrada] };
}

function campoPlural(ruta, valor, etiqueta) {
  const uno = caja(valor.uno ?? '', `${etiqueta}: si es 1`);
  const varios = caja(valor.varios ?? '', `${etiqueta}: si son varios`);
  return {
    elemento: crear('div', { class: 'admin-plural' },
      crear('label', {}, crear('span', { texto: 'Si es 1' }), uno),
      crear('label', {}, crear('span', { texto: 'Si son varios' }), varios)
    ),
    leer: () => ({ uno: uno.value.trim(), varios: varios.value.trim() }),
    entradas: [uno, varios],
  };
}

function campoLista(ruta, valor, etiqueta) {
  const contenedor = crear('div', { class: 'admin-lista-textos' });
  const agregar = (texto = '') => {
    const entrada = caja(texto, etiqueta);
    const fila = crear('div', { class: 'admin-lista-textos__fila' },
      entrada,
      crear('button', {
        type: 'button', class: 'admin-opcion__quitar', 'aria-label': 'Quitar este texto', texto: '×',
        onclick: () => { fila.remove(); marcarCambios(); },
      })
    );
    entrada.addEventListener('input', marcarCambios);
    contenedor.append(fila);
    return entrada;
  };
  for (const texto of valor) agregar(texto);
  const boton = crear('button', {
    type: 'button', class: 'boton boton--secundario admin-lista-textos__agregar', texto: '+ Otro',
    onclick: () => { agregar().focus(); marcarCambios(); },
  });
  return {
    elemento: crear('div', {}, contenedor, boton),
    leer: () => [...contenedor.querySelectorAll('input, textarea')].map((e) => e.value.trim()).filter(Boolean),
    entradas: [],
  };
}

function armarCampos(objeto, prefijo = '') {
  const lista = [];
  for (const [clave, valor] of Object.entries(objeto)) {
    if (clave.startsWith('_')) continue;
    const ruta = prefijo + clave;
    const etiqueta = ETIQUETAS[ruta] ?? ruta;
    let campo;
    if (typeof valor === 'string') campo = { tipo: 'texto', ...campoTexto(ruta, valor, etiqueta) };
    else if (esPlural(valor)) campo = { tipo: 'plural', ...campoPlural(ruta, valor, etiqueta) };
    else if (Array.isArray(valor)) campo = { tipo: 'lista', ...campoLista(ruta, valor, etiqueta) };
    else if (valor && typeof valor === 'object') {
      lista.push(...armarCampos(valor, `${ruta}.`));
      continue;
    } else continue;

    for (const entrada of campo.entradas) entrada.addEventListener('input', marcarCambios);
    campo.ruta = ruta;
    campo.original = valor;
    campo.contenedor = crear('div', { class: 'campo admin-campo-texto', 'data-ruta': ruta },
      crear('span', { texto: etiqueta }),
      campo.elemento,
      ayudaVariables(valor)
    );
    lista.push(campo);
  }
  return lista;
}

// ---------- Cambios ----------

const cambio = (campo) => JSON.stringify(campo.leer()) !== JSON.stringify(campo.original);

function camposCambiados() {
  return campos.filter(cambio);
}

function musicaCambiada() {
  return Object.entries(camposMusica).some(([clave, entrada]) => entrada.value.trim() !== (musica[clave] ?? ''));
}

export function tieneCambios() {
  return camposCambiados().length > 0 || musicaCambiada();
}

function marcarCambios() {
  for (const campo of campos) campo.contenedor.classList.toggle('admin-campo-texto--cambiado', cambio(campo));
  for (const grupo of lugar().querySelectorAll('[data-grupo]')) {
    const cantidad = grupo.querySelectorAll('.admin-campo-texto--cambiado').length;
    const marca = $('[data-cambios]', grupo);
    marca.textContent = cantidad ? `${cantidad} cambio${cantidad > 1 ? 's' : ''}` : '';
  }
  const total = camposCambiados().length + (musicaCambiada() ? 1 : 0);
  const boton = $('[data-guardar-textos]');
  boton.disabled = !total;
  boton.textContent = total ? `Guardar ${total} cambio${total > 1 ? 's' : ''}` : 'Sin cambios';
}

// ---------- Pantalla ----------

function grupoMusica() {
  const etiquetas = { cancion: 'Nombre de la canción', artista: 'Artista', spotify: 'Link de Spotify (Compartir → Copiar enlace)' };
  camposMusica = {};
  const filas = Object.entries(etiquetas).map(([clave, etiqueta]) => {
    const entrada = crear('input', { type: clave === 'spotify' ? 'url' : 'text', 'aria-label': etiqueta });
    entrada.value = musica[clave] ?? '';
    entrada.addEventListener('input', marcarCambios);
    camposMusica[clave] = entrada;
    return crear('label', { class: 'campo' }, crear('span', { texto: etiqueta }), entrada);
  });
  return crear('details', { class: 'admin-grupo', 'data-grupo': 'cancion' },
    crear('summary', {}, crear('span', { texto: 'La canción' }), crear('small', { 'data-cambios': '' })),
    crear('div', { class: 'admin-grupo__campos' }, ...filas)
  );
}

function pintar() {
  campos = armarCampos(textos);
  const porGrupo = new Map();
  for (const campo of campos) {
    const grupo = campo.ruta.split('.')[0];
    if (!porGrupo.has(grupo)) porGrupo.set(grupo, []);
    porGrupo.get(grupo).push(campo);
  }
  lugar().replaceChildren(
    grupoMusica(),
    ...[...porGrupo].map(([grupo, lista]) =>
      crear('details', { class: 'admin-grupo', 'data-grupo': grupo },
        crear('summary', {}, crear('span', { texto: GRUPOS[grupo] ?? grupo }), crear('small', { 'data-cambios': '' })),
        crear('div', { class: 'admin-grupo__campos' }, ...lista.map((c) => c.contenedor))
      )
    )
  );
  marcarCambios();
}

export async function abrir() {
  const [t, m] = await Promise.all([leerJSON(RUTA_TEXTOS), leerJSON(RUTA_MUSICA)]);
  textos = t.datos;
  musica = m.datos;
  pintar();
  vista('lista-textos');
}

// ---------- Guardar ----------

function errores(cambiados) {
  const lista = [];
  for (const campo of cambiados) {
    const valor = campo.leer();
    const nombre = ETIQUETAS[campo.ruta] ?? campo.ruta;
    const vacio = campo.tipo === 'texto' ? !valor : campo.tipo === 'plural' ? !valor.uno || !valor.varios : !valor.length;
    if (vacio) {
      lista.push({ campo, mensaje: `«${nombre}» no puede quedar vacío.` });
      continue;
    }
    const permitidas = variablesDe(JSON.stringify(campo.original));
    const raras = [...variablesDe(JSON.stringify(valor))].filter((v) => !permitidas.has(v));
    if (raras.length) {
      const opciones = permitidas.size ? ` Acá podés usar: ${[...permitidas].map((v) => `{${v}}`).join(', ')}.` : '';
      lista.push({ campo, mensaje: `«${nombre}» tiene ${raras.map((v) => `{${v}}`).join(', ')}, que no existe.${opciones}` });
    }
  }
  if (musicaCambiada() && !/track[/:][A-Za-z0-9]+/.test(camposMusica.spotify.value)) {
    lista.push({ campo: null, mensaje: 'El link de Spotify tiene que ser de una canción (open.spotify.com/…/track/…).' });
  }
  return lista;
}

$('[data-guardar-textos]').addEventListener('click', (e) => {
  const boton = e.currentTarget;
  const cambiados = camposCambiados();
  if (!cambiados.length && !musicaCambiada()) return;
  const problemas = errores(cambiados);
  const cajaError = $('[data-vista="lista-textos"] [data-error]');
  for (const campo of campos) campo.contenedor.classList.remove('admin-campo-texto--error');
  if (problemas.length) {
    cajaError.textContent = problemas.map((p) => p.mensaje).join(' ');
    cajaError.hidden = false;
    for (const { campo } of problemas) {
      if (!campo) continue;
      campo.contenedor.classList.add('admin-campo-texto--error');
      campo.contenedor.closest('details').open = true;
    }
    cajaError.focus();
    return;
  }
  cajaError.hidden = true;

  publicando(boton, async () => {
    if (cambiados.length) {
      estado('Guardando los textos…');
      const valores = cambiados.map((campo) => [campo.ruta, campo.leer()]);
      textos = await modificarJSON(RUTA_TEXTOS, (contenido) => {
        for (const [ruta, valor] of valores) poner(contenido, ruta, valor);
      }, `Admin: cambiar ${valores.length} texto${valores.length > 1 ? 's' : ''}`);
    }
    if (musicaCambiada()) {
      estado('Guardando la canción…');
      const nueva = Object.fromEntries(Object.entries(camposMusica).map(([clave, entrada]) => [clave, entrada.value.trim()]));
      musica = await modificarJSON(RUTA_MUSICA, (contenido) => Object.assign(contenido, nueva), `Admin: cambiar la canción`);
    }
    const abiertos = [...lugar().querySelectorAll('details[open]')].map((d) => d.dataset.grupo);
    pintar();
    for (const grupo of abiertos) lugar().querySelector(`[data-grupo="${grupo}"]`).open = true;
    estado('¡Publicado! Los cambios se ven en 1 o 2 minutos.', 'ok');
  }).then(marcarCambios);
});
