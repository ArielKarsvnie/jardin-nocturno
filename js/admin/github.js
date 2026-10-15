// Leer y escribir archivos del repo con la API de GitHub: es lo mismo que un commit + push, pero desde el navegador.
// Necesita un token "fine-grained" con acceso solo a este repo y permiso Contents: Read and write.
// El token queda guardado únicamente en este navegador; nunca se sube al repo.

const API = 'https://api.github.com';
const CLAVE_TOKEN = 'jardin-nocturno:admin-token';

// En GitHub Pages se deduce de la dirección (usuario.github.io/repo). En localhost usa estos valores.
export const REPO = (() => {
  const usuario = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i)?.[1];
  const nombre = location.pathname.split('/').filter(Boolean)[0];
  if (usuario && nombre) return { duenio: usuario, nombre, rama: 'main', local: false };
  return { duenio: 'ArielKarsvnie', nombre: 'jardin-nocturno', rama: 'main', local: true };
})();

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN) ?? '';
  } catch {
    return '';
  }
}

export function guardarToken(token) {
  try {
    localStorage.setItem(CLAVE_TOKEN, token);
  } catch {
    throw new Error('Este navegador no deja guardar el token (¿modo incógnito?).');
  }
}

export function olvidarToken() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // nada que olvidar
  }
}

// ---------- Texto y archivos en base64 (lo que pide la API) ----------

export function textoABase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

function base64ATexto(base64) {
  const binario = atob(base64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
}

// ---------- Pedidos ----------

const MENSAJES = {
  401: 'El token no es válido o ya venció. Creá uno nuevo y pegalo de nuevo.',
  403: 'El token no tiene permiso para escribir. Revisá que tenga "Contents: Read and write".',
  404: 'No encontré el repo o el archivo. ¿El token tiene acceso a este repo?',
  409: 'El archivo cambió mientras guardabas. Probá de nuevo.',
};

async function pedir(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API}/repos/${REPO.duenio}/${REPO.nombre}${ruta}`, {
      ...opciones,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${leerToken()}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new Error('No hay conexión con GitHub. Revisá internet y probá de nuevo.');
  }
  if (!respuesta.ok) {
    const error = new Error(MENSAJES[respuesta.status] ?? `GitHub respondió con un error (${respuesta.status}).`);
    error.status = respuesta.status;
    throw error;
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

// Confirma que el token sirve y que tiene permiso de escritura en el repo.
export async function probarToken() {
  const repo = await pedir('');
  if (repo.permissions && !repo.permissions.push) {
    const error = new Error(MENSAJES[403]);
    error.status = 403;
    throw error;
  }
}

async function leerArchivo(ruta) {
  return pedir(`/contents/${ruta}?ref=${REPO.rama}`);
}

export async function shaSiExiste(ruta) {
  try {
    return (await leerArchivo(ruta)).sha;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function leerJSON(ruta) {
  const archivo = await leerArchivo(ruta);
  return { sha: archivo.sha, datos: JSON.parse(base64ATexto(archivo.content)) };
}

// Crea o reemplaza un archivo. Cada llamada es un commit.
export function guardarArchivo(ruta, base64, mensaje, sha = null) {
  return pedir(`/contents/${ruta}`, {
    method: 'PUT',
    body: JSON.stringify({ message: mensaje, content: base64, branch: REPO.rama, ...(sha ? { sha } : {}) }),
  });
}

export function borrarArchivo(ruta, mensaje, sha) {
  return pedir(`/contents/${ruta}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: mensaje, sha, branch: REPO.rama }),
  });
}

// Lee la versión más nueva del JSON, le aplica el cambio y lo guarda.
// Si justo cambió en el medio (por ejemplo, desde otro celular), lo intenta una vez más.
export async function modificarJSON(ruta, cambio, mensaje) {
  for (let intento = 0; ; intento++) {
    const { sha, datos } = await leerJSON(ruta);
    cambio(datos);
    try {
      await guardarArchivo(ruta, textoABase64(`${JSON.stringify(datos, null, 2)}\n`), mensaje, sha);
      return datos;
    } catch (error) {
      if (error.status !== 409 || intento > 0) throw error;
    }
  }
}
