import { useMemo, type ComponentType, type Ref } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../ui/Text';
import { validSdkUrl, type ProtectCheckProps } from './protectTypes';

const WV = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebView> }>;

/**
 * Verificación anti-bots de Clerk Protect (Android/iOS): el módulo del desafío corre dentro de un
 * WebView y devuelve el "proof token" por postMessage.
 */
export function ProtectCheck({ challenge, onToken, onError }: ProtectCheckProps) {
  const { colors, isDark } = useTheme();
  const url = validSdkUrl(challenge.sdkUrl);
  const html = useMemo(
    () => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:${isDark ? '#100E2E' : '#F4F5FB'};display:flex;justify-content:center}</style></head>
<body><div id="c"></div><script type="module">
const post = (o) => window.ReactNativeWebView.postMessage(JSON.stringify(o));
try {
  const mod = await import(${JSON.stringify(url ?? '')});
  if (typeof mod.default !== 'function') throw new Error('Módulo de verificación no válido');
  const proof = await mod.default(document.getElementById('c'), { token: ${JSON.stringify(challenge.token)}, uiHints: ${JSON.stringify(challenge.uiHints ?? {})}, setWidgetVisible: async () => {} });
  post({ type: 'proof', proof });
} catch (e) { post({ type: 'error', message: String(e && e.message || e) }); }
</script></body></html>`,
    [challenge.token, challenge.uiHints, isDark, url],
  );
  if (!url) {
    onError('La verificación de seguridad entregó una URL no válida.');
    return null;
  }
  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'proof') onToken(m.proof);
      if (m.type === 'error') onError(m.message);
    } catch {
      // ignorado
    }
  };
  return (
    <View style={{ gap: 10, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <ShieldCheck size={18} color={colors.primary} />
        <Text variant="smallStrong">Verificación de seguridad</Text>
      </View>
      <View style={{ width: 320, height: 90 }}>
        <WV originWhitelist={['*']} source={{ html, baseUrl: new URL(url).origin }} onMessage={onMessage} javaScriptEnabled style={{ backgroundColor: 'transparent' }} />
      </View>
    </View>
  );
}
