// Achica la foto en el navegador antes de subirla, igual que herramientas/optimizar_fotos.py:
// 1200 px del lado más largo, WebP (o JPG si el navegador no sabe hacer WebP).
// Al redibujarla en un canvas se pierden todos los metadatos, incluida la ubicación GPS.

const LADO_MAXIMO = 1200;
const CALIDAD = 0.8;

function cargarImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => resolver({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error(/hei[cf]/i.test(archivo.type || archivo.name)
        ? 'Este navegador no puede abrir fotos HEIC. Subila desde el celular o pasala a JPG.'
        : 'No pude abrir esa foto. Probá con otra (JPG o PNG).'));
    };
    img.src = url;
  });
}

function aBlob(canvas, tipo) {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, CALIDAD));
}

export async function comprimir(archivo) {
  const { img, url } = await cargarImagen(archivo);
  try {
    // El navegador ya respeta la rotación del celular al dibujarla.
    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    let blob = await aBlob(canvas, 'image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await aBlob(canvas, 'image/jpeg');
    if (!blob) throw new Error('No pude comprimir la foto.');

    return {
      blob,
      extension: blob.type === 'image/webp' ? 'webp' : 'jpg',
      ancho: canvas.width,
      alto: canvas.height,
      antesKB: Math.round(archivo.size / 1024),
      despuesKB: Math.round(blob.size / 1024),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function blobABase64(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1]);
    lector.onerror = () => rechazar(new Error('No pude leer la foto comprimida.'));
    lector.readAsDataURL(blob);
  });
}
