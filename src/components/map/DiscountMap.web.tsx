import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DiscountMapProps } from './mapTypes';
import { ATTRIBUTION, MARKER_CSS, TILE_DARK, TILE_LIGHT, markerHtml } from './leafletHtml';

function ensureCss() {
  if (document.getElementById('lk-map-css')) return;
  const s = document.createElement('style');
  s.id = 'lk-map-css';
  s.textContent = MARKER_CSS;
  document.head.appendChild(s);
}

export function DiscountMap({ center, user, radius, markers, selectedId, onSelect, onMoveEnd, dark, colors, fitToMarkers, focusZoom, accessibilityLabel = 'Mapa de descuentos cercanos' }: DiscountMapProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const me = useRef<L.LayerGroup | null>(null);
  const cb = useRef({ onSelect, onMoveEnd });
  const mounted = useRef(false);
  cb.current = { onSelect, onMoveEnd };

  useEffect(() => {
    ensureCss();
    if (!host.current || map.current) return;
    const m = L.map(host.current, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], 14);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    me.current = L.layerGroup().addTo(m);
    m.on('moveend', () => {
      const c = m.getCenter();
      cb.current.onMoveEnd?.({ lat: c.lat, lng: c.lng });
    });
    map.current = m;
    setTimeout(() => m.invalidateSize(), 50);
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    tiles.current = L.tileLayer(dark ? TILE_DARK : TILE_LIGHT, { attribution: ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(m);
    host.current?.style.setProperty('--primary', colors.primary);
    host.current?.style.setProperty('--coin', colors.coin);
    host.current?.style.setProperty('--oncoin', colors.onCoin);
  }, [dark, colors]);

  useEffect(() => {
    // El mapa ya nace centrado en `center`: solo se vuela cuando cambia después.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    map.current?.flyTo([center.lat, center.lng], focusZoom ?? map.current.getZoom(), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  useEffect(() => {
    const g = me.current;
    if (!g) return;
    g.clearLayers();
    if (user) {
      L.marker([user.lat, user.lng], { icon: L.divIcon({ className: '', html: '<div class="lk-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false }).addTo(g);
      if (radius) L.circle([user.lat, user.lng], { radius, color: colors.primary, weight: 1.5, fillOpacity: 0.05, dashArray: '6 6' }).addTo(g);
    }
  }, [user, radius, colors.primary]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.forEach((mk, i) => {
      const marker = L.marker([mk.lat, mk.lng], {
        icon: L.divIcon({ className: '', html: markerHtml(mk, Math.min(i * 25, 600), mk.id === selectedId), iconSize: [46, 56], iconAnchor: [14, 52] }),
        title: mk.title,
        riseOnHover: true,
        keyboard: true,
      });
      marker.on('click', () => cb.current.onSelect?.(mk.id));
      marker.addTo(g);
    });
  }, [markers, selectedId]);

  useEffect(() => {
    const m = map.current;
    if (!m || !fitToMarkers || !markers.length) return;
    if (markers.length === 1) m.setView([markers[0]!.lat, markers[0]!.lng], 15);
    else m.fitBounds(L.latLngBounds(markers.map((mk) => [mk.lat, mk.lng] as [number, number])), { padding: [48, 48], maxZoom: 15 });
  }, [markers, fitToMarkers]);

  return (
    <View style={{ flex: 1 }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} role="application" aria-label={accessibilityLabel} />
    </View>
  );
}
