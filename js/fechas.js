// Fechas siempre en hora de Argentina, sin importar dónde esté configurado el celular.

export const ZONA = 'America/Argentina/Tucuman';

// "2025-12-07" → mediodía de ese día en Argentina (así no se corre al día anterior por zona horaria).
export function aFecha(iso) {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00-03:00` : iso);
}

// Para probar las cartas antes de tiempo SOLO en tu compu o en tu red de casa:
//   http://localhost:8000/?ahora=2026-11-08T23:59:50-03:00#cartas
// El reloj arranca en ese momento y sigue corriendo. En GitHub Pages se ignora.
const ES_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(location.hostname);
const simulada = ES_LOCAL ? new URLSearchParams(location.search).get('ahora') : null;
const desfase = simulada && !Number.isNaN(aFecha(simulada).getTime())
  ? aFecha(simulada).getTime() - Date.now()
  : 0;

// Momento actual en milisegundos. El instante es el mismo en cualquier zona horaria;
// lo que importa es que las fechas de las cartas tienen -03:00 (hora de Argentina).
export function ahora() {
  return Date.now() + desfase;
}

const FORMATOS = {
  larga: { day: 'numeric', month: 'long', year: 'numeric' },
  corta: { month: 'short', year: 'numeric' },
  conHora: { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
};

export function formatearFecha(iso, estilo = 'larga') {
  if (!iso) return '';
  const fecha = aFecha(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  const texto = new Intl.DateTimeFormat('es-AR', { ...FORMATOS[estilo], timeZone: ZONA }).format(fecha);
  // "dic. de 2025" → "dic 2025"
  return estilo === 'corta' ? texto.replace('.', '').replace(' de ', ' ') : texto;
}
