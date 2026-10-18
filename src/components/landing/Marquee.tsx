import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { BrandLogo } from '../brand/BrandLogo';
import { Text } from '../ui/Text';

export interface MarqueeItem {
  name: string;
  domain: string;
  color: string;
}

/** Cinta infinita de logos; dos filas en sentidos opuestos crean el efecto. */
export function Marquee({ items, reverse, speed = 40 }: { items: MarqueeItem[]; reverse?: boolean; speed?: number }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (!w) return;
    x.value = 0;
    x.value = withRepeat(withTiming(1, { duration: (w / speed) * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [w, speed, x]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: reverse ? -w + x.value * w : -x.value * w }] }));
  const row = (k: string) => (
    <View key={k} onLayout={k === 'a' ? (e) => setW(e.nativeEvent.layout.width) : undefined} style={{ flexDirection: 'row', gap: 12, paddingRight: 12 }}>
      {items.map((i) => (
        <View key={i.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 10, paddingRight: 18, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <BrandLogo name={i.name} domain={i.domain} color={i.color} size={30} shape="circle" />
          <Text variant="smallStrong">{i.name}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ overflow: 'hidden' }} accessibilityLabel="Bancos, tarjetas, cajas y clubes compatibles">
      <Animated.View style={[{ flexDirection: 'row' }, s]}>
        {row('a')}
        {row('b')}
      </Animated.View>
    </View>
  );
}
