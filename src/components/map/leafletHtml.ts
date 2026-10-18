/**
 * Código compartido del mapa (Leaflet + teselas CARTO). En web se ejecuta directamente;
 * en Android se inyecta en un WebView y se comunica por postMessage.
 * CARTO exige una API key (gratis en carto.com/basemaps/apikey): va en EXPO_PUBLIC_CARTO_KEY.
 */
const CARTO_KEY = process.env.EXPO_PUBLIC_CARTO_KEY ?? '';
const keyParam = CARTO_KEY ? `?key=${encodeURIComponent(CARTO_KEY)}` : '';
export const TILE_LIGHT = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`;
export const TILE_DARK = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`;
export const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const MARKER_CSS = `
.lk-pin{position:relative;width:46px;height:56px;transform-origin:50% 100%;animation:lk-drop .5s cubic-bezier(.2,1.4,.4,1) both}
.lk-pin .lk-head{position:absolute;left:0;top:0;width:46px;height:46px;border-radius:16px 16px 16px 4px;transform:rotate(-45deg);box-shadow:0 6px 16px rgba(27,22,96,.28);border:3px solid var(--c)}
.lk-pin .lk-logo{position:absolute;left:6px;top:6px;width:34px;height:34px;border-radius:50%;background:#fff center/72% no-repeat;display:flex;align-items:center;justify-content:center;font:800 13px/1 system-ui;color:#fff}
.lk-pin .lk-badge{position:absolute;right:-12px;top:-8px;min-width:22px;padding:2px 6px;border-radius:999px;background:var(--coin);color:var(--oncoin);font:800 11px/16px system-ui;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.2);white-space:nowrap}
.lk-pin.sel{z-index:999!important}
.lk-pin.sel .lk-head{transform:rotate(-45deg) scale(1.18);border-color:var(--coin)}
.lk-me{width:18px;height:18px;border-radius:50%;background:var(--primary);border:3px solid #fff;box-shadow:0 0 0 0 rgba(43,31,168,.5);animation:lk-pulse 2s infinite}
@keyframes lk-drop{from{transform:translateY(-30px) scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes lk-pulse{0%{box-shadow:0 0 0 0 rgba(43,31,168,.45)}70%{box-shadow:0 0 0 18px rgba(43,31,168,0)}100%{box-shadow:0 0 0 0 rgba(43,31,168,0)}}
.leaflet-container{font-family:system-ui;background:transparent}
.leaflet-control-attribution{font-size:9px!important}
`;

export function markerHtml(m: { logo: string | null; color: string; badge: string; title: string; count: number }, delayMs: number, selected: boolean) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
  const logo = m.logo ? `style="background-image:url('${esc(m.logo)}')"` : `style="background:${esc(m.color)}"`;
  const initials = m.logo ? '' : esc(m.title.slice(0, 2).toUpperCase());
  const badge = m.count > 1 ? `${esc(m.badge)} +${m.count - 1}` : esc(m.badge);
  return `<div class="lk-pin${selected ? ' sel' : ''}" style="--c:${esc(m.color)};animation-delay:${delayMs}ms"><div class="lk-head" style="background:${esc(m.color)}"></div><div class="lk-logo" ${logo}>${initials}</div><div class="lk-badge">${badge}</div></div>`;
}
