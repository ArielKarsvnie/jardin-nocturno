// Dónde buscar la foto de un recuerdo, en orden:
// 1. assets/fotos/<nombre>.webp  → la que genera el script de fotos a partir de "primera-cita.jpg"
// 2. assets/fotos/<nombre tal cual> → la que sube el admin (ya optimizada, .webp o .jpg)
export function rutasFoto(nombre) {
  const webp = `assets/fotos/${nombre.replace(/\.[^./]+$/, '')}.webp`;
  const literal = `assets/fotos/${nombre}`;
  return webp === literal ? [webp] : [webp, literal];
}

// Pone en <img> la primera ruta que exista; si ninguna existe, llama a alFallar.
export function cargarFoto(img, nombre, alFallar) {
  const rutas = rutasFoto(nombre);
  let i = 0;
  img.addEventListener('error', () => {
    i++;
    if (i < rutas.length) img.src = rutas[i];
    else alFallar?.();
  });
  img.src = rutas[0];
}
