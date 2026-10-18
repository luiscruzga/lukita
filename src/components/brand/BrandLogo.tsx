import { useState } from 'react';
import { Image, View } from 'react-native';
import { Text } from '../ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Fuentes de logo en orden de preferencia: logo guardado → favicon de Google (responde 404 si no hay,
 * así caemos al monograma). Se usa <Image> de RN y no expo-image: en web expo-image pide la imagen
 * con crossOrigin y el servicio de favicons no envía cabeceras CORS.
 */
export function logoSources(domain?: string | null, logoUrl?: string | null): string[] {
  const list: string[] = [];
  if (logoUrl) list.push(logoUrl);
  if (domain) {
    const host = domain.startsWith('www.') ? domain : `www.${domain}`;
    list.push(`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(host)}&size=128`);
  }
  return list;
}

export function logoFor(domain?: string | null, logoUrl?: string | null) {
  return logoSources(domain, logoUrl)[0] ?? null;
}

/**
 * Logo de un proveedor (banco, farmacia…) o comercio. Usa el logo guardado, si no el favicon del
 * dominio, y si falla un monograma con el color de marca.
 */
export function BrandLogo({ name, domain, logoUrl, color, size = 40, shape = 'squircle' }: { name: string; domain?: string | null; logoUrl?: string | null; color?: string | null; size?: number; shape?: 'circle' | 'squircle' }) {
  const { colors } = useTheme();
  const [attempt, setAttempt] = useState(0);
  const sources = logoSources(domain, logoUrl);
  const src = sources[attempt] ?? null;
  const failed = !src;
  const r = shape === 'circle' ? size / 2 : size * 0.3;
  const bg = color ?? colors.primary;
  const initials = name.replace(/^(Banco|Tarjeta|Caja|Farmacias?|AFP|Isapre)\s+/i, '').slice(0, 2).toUpperCase();
  return (
    <View
      style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', backgroundColor: src && !failed ? '#FFFFFF' : bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }}
      accessibilityRole="image"
      accessibilityLabel={`Logo de ${name}`}
    >
      {src && !failed ? (
        <Image source={{ uri: src }} style={{ width: size * 0.72, height: size * 0.72 }} resizeMode="contain"
          onError={() => setAttempt((a) => a + 1)}
          // El servicio de favicons responde 404 con un globo genérico de 16px: lo tratamos como fallo.
          onLoad={(e) => {
            const w = (e.nativeEvent as { source?: { width?: number } }).source?.width;
            if (w && w <= 16 && src !== logoUrl) setAttempt((a) => a + 1);
          }}
        />
      ) : (
        <Text style={{ color: '#FFFFFF', fontSize: size * 0.36, fontFamily: 'BricolageGrotesque_800ExtraBold' }}>{initials}</Text>
      )}
    </View>
  );
}
