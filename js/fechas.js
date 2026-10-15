// Fechas siempre en hora de Argentina, sin importar dónde esté configurado el celular.

export const ZONA = 'America/Argentina/Tucuman';

// "2025-12-07" → mediodía de ese día en Argentina (así no se corre al día anterior por zona horaria).
export function aFecha(iso) {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00-03:00` : iso);
}

const FORMATOS = {
  larga: { day: 'numeric', month: 'long', year: 'numeric' },
  corta: { month: 'short', year: 'numeric' },
};

export function formatearFecha(iso, estilo = 'larga') {
  if (!iso) return '';
  const fecha = aFecha(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat('es-AR', { ...FORMATOS[estilo], timeZone: ZONA })
    .format(fecha)
    .replace('.', '')
    .replace(' de ', ' ');
}
