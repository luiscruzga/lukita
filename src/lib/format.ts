const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('es-CL');

export const formatCLP = (n?: number | null) => (n === null || n === undefined ? '—' : clp.format(n));
export const formatNumber = (n?: number | null) => (n === null || n === undefined ? '—' : num.format(n));
export const compactCLP = (n: number) => (Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1).replace('.0', '')}M` : Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);

export function formatDistance(m?: number | null) {
  if (m === null || m === undefined) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}
