import { useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

// react-native-webview aún declara un componente de clase con los tipos antiguos de RN.
const WV = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebView> }>;
import type { DiscountMapProps } from './mapTypes';
import { ATTRIBUTION, MARKER_CSS, TILE_DARK, TILE_LIGHT, markerHtml } from './leafletHtml';

/** Android/iOS: Leaflet dentro de un WebView. Sin claves de Google Maps y con los mismos marcadores que en web. */
export function DiscountMap({ center, user, radius, markers, selectedId, onSelect, onMoveEnd, dark, colors, fitToMarkers, focusZoom, accessibilityLabel = 'Mapa de descuentos cercanos' }: DiscountMapProps) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const flown = useRef(false);

  const html = useMemo(
    () => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{margin:0;height:100%;background:${dark ? '#100E2E' : '#F4F5FB'}}:root{--primary:${colors.primary};--coin:${colors.coin};--oncoin:${colors.onCoin}}${MARKER_CSS}</style></head>
<body><div id="m"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
var map=L.map('m',{zoomControl:false}).setView([${center.lat},${center.lng}],14);
var tiles=L.tileLayer('${dark ? TILE_DARK : TILE_LIGHT}',{attribution:'${ATTRIBUTION.replace(/'/g, "\\'")}',maxZoom:19,subdomains:'abcd'}).addTo(map);
var pins=L.layerGroup().addTo(map), me=L.layerGroup().addTo(map);
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o))}
map.on('moveend',function(){var c=map.getCenter();post({type:'move',lat:c.lat,lng:c.lng})});
window.lk={
  pins:function(list){pins.clearLayers();list.forEach(function(p){var m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:p.html,iconSize:[46,56],iconAnchor:[14,52]})});m.on('click',function(){post({type:'select',id:p.id})});m.addTo(pins)})},
  me:function(u,r,c){me.clearLayers();if(!u)return;L.marker([u.lat,u.lng],{icon:L.divIcon({className:'',html:'<div class="lk-me"></div>',iconSize:[18,18],iconAnchor:[9,9]}),interactive:false}).addTo(me);if(r)L.circle([u.lat,u.lng],{radius:r,color:c,weight:1.5,fillOpacity:.05,dashArray:'6 6'}).addTo(me)},
  fly:function(lat,lng,z){map.flyTo([lat,lng],z||map.getZoom(),{duration:.8})},
  fit:function(list){if(!list.length)return;if(list.length===1){map.setView([list[0].lat,list[0].lng],15);return}map.fitBounds(L.latLngBounds(list.map(function(p){return [p.lat,p.lng]})),{padding:[48,48],maxZoom:15})}
};
post({type:'ready'});
</script></body></html>`,
    // El HTML solo se regenera al cambiar el tema; el resto se actualiza por inyección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dark],
  );

  const run = (js: string) => ref.current?.injectJavaScript(`try{${js}}catch(e){};true;`);

  useEffect(() => {
    if (!ready) return;
    const list = markers.map((m, i) => ({ id: m.id, lat: m.lat, lng: m.lng, html: markerHtml(m, Math.min(i * 25, 600), m.id === selectedId) }));
    run(`lk.pins(${JSON.stringify(list)})`);
  }, [markers, selectedId, ready]);

  useEffect(() => {
    if (ready && fitToMarkers && markers.length) run(`lk.fit(${JSON.stringify(markers.map((m) => ({ lat: m.lat, lng: m.lng })))})`);
  }, [markers, fitToMarkers, ready]);

  useEffect(() => {
    if (ready) run(`lk.me(${JSON.stringify(user ?? null)},${radius ?? 0},${JSON.stringify(colors.primary)})`);
  }, [user, radius, ready, colors.primary]);

  useEffect(() => {
    if (!ready) return;
    // El HTML ya nace centrado en `center`: solo se vuela cuando cambia después.
    if (!flown.current) {
      flown.current = true;
      return;
    }
    run(`lk.fly(${center.lat},${center.lng},${focusZoom ?? 0})`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, ready]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') setReady(true);
      if (msg.type === 'select') onSelect?.(msg.id);
      if (msg.type === 'move') onMoveEnd?.({ lat: msg.lat, lng: msg.lng });
    } catch {
      // mensaje no reconocido
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WV
        key={dark ? 'dark' : 'light'}
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        onLoadStart={() => {
          setReady(false);
          flown.current = false;
        }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}
