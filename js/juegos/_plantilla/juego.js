// Plantilla para un juego nuevo.
//
// 1. Copiá esta carpeta como js/juegos/<nombre>/ (por ejemplo js/juegos/memotest/).
// 2. Sumá el juego a data/juegos.json:
//      { "id": "memotest", "titulo": "Memotest", "descripcion": "Encontrá las parejas", "modulo": "memotest" }
//    Si el juego necesita contenido propio, agregá "datos": "memotest" y creá data/memotest.json.
//
// montar() recibe:
//   contenedor → el lugar donde dibujar el juego
//   juego      → la entrada de data/juegos.json
//   datos      → el contenido de data/<datos>.json (o null)
//   crear, t   → los mismos ayudantes que usa el resto de la página
// y puede devolver una función que se llama al salir (para frenar timers, etc.).

export function montar(contenedor, { juego, datos, crear }) {
  // Si el juego tiene estilos propios, ponelos en estilos.css al lado de este archivo:
  // contenedor.append(crear('link', { rel: 'stylesheet', href: new URL('./estilos.css', import.meta.url) }));

  contenedor.append(
    crear('h2', { texto: juego.titulo }),
    crear('p', { texto: datos ? 'Tengo datos para jugar.' : 'Acá va el juego.' })
  );

  return () => {
    // limpiar al salir
  };
}
