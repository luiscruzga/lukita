/** Utilidades de fecha sin dependencias. Fechas de calendario como 'YYYY-MM-DD' (sin zona horaria). */
export const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Matriz de 6 semanas (lunes primero) para un mes dado. */
export function monthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = addDays(first, -offset);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (__, d) => addDays(start, w * 7 + d)));
}

export function formatDate(s?: string | null, opts: { withYear?: boolean; weekday?: boolean } = {}) {
  const d = parseISODate(s);
  if (!d) return '';
  const base = `${d.getDate()} de ${MONTHS[d.getMonth()]}${opts.withYear !== false ? ` ${d.getFullYear()}` : ''}`;
  return opts.weekday ? `${WEEKDAYS_LONG[d.getDay()]} ${base}` : base;
}

export function formatRelativeDays(s?: string | null) {
  const d = parseISODate(s);
  if (!d) return '';
  const today = parseISODate(todayISO())!;
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  if (diff > 1 && diff < 7) return `en ${diff} días`;
  if (diff < 0) return 'vencido';
  return formatDate(s, { withYear: false });
}

/** Lista legible de días: [1,2] → "lunes y martes"; todos → "todos los días". */
export function describeDays(days?: number[] | null) {
  if (!days || days.length === 0 || days.length === 7) return 'Todos los días';
  const sorted = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const names = sorted.map((d) => WEEKDAYS_LONG[d]);
  if (names.length === 1) return `Los ${names[0]}`;
  if (sorted.join() === '1,2,3,4,5') return 'De lunes a viernes';
  if (sorted.join() === '6,0') return 'Fines de semana';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`.replace(/^./, (c) => c.toUpperCase());
}

export function formatTime(t?: string | null) {
  if (!t) return '';
  return t.slice(0, 5);
}

/** "hace 5 min", "en 2 h", "hace 3 d" a partir de un ISO timestamp. */
export function relativeTime(iso?: string | null, now = Date.now()) {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60_000);
  const txt = m < 1 ? 'un momento' : m < 60 ? `${m} min` : m < 60 * 48 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
  if (m < 1) return diff > 0 ? 'en un momento' : 'recién';
  return diff > 0 ? `en ${txt}` : `hace ${txt}`;
}

export function formatDuration(ms?: number | null) {
  if (ms === null || ms === undefined) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
