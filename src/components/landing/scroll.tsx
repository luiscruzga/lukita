import { createContext, useContext, useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';

interface ScrollCtx {
  y: SharedValue<number>;
  vh: number;
}
export const LandingScroll = createContext<ScrollCtx | null>(null);
export const useLandingScroll = () => useContext(LandingScroll)!;

/**
 * Sección con progreso de scroll propio: 0 cuando su borde superior entra por abajo de la pantalla,
 * 1 cuando su borde inferior sale por arriba. Se pasa a los hijos como `progress`.
 * Debe ser hija directa del contenido del ScrollView (mide su `y` con onLayout).
 */
export function ScrollSection({ children, style, id }: { children: (progress: SharedValue<number>) => ReactNode; style?: StyleProp<ViewStyle>; id?: string }) {
  const { y, vh } = useLandingScroll();
  const [box, setBox] = useState({ top: 0, h: 1 });
  const progress = useDerivedValue(() => interpolate(y.value, [box.top - vh, box.top + box.h], [0, 1], Extrapolation.CLAMP));
  return (
    <View nativeID={id} onLayout={(e) => setBox({ top: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })} style={style}>
      {children(progress)}
    </View>
  );
}

/** Aparición ligada al scroll (no por tiempo): sube y se revela entre `from` y `to` del progreso. */
export function Reveal({ progress, from = 0.05, to = 0.3, distance = 40, children, style, rotate = 0 }: { progress: SharedValue<number>; from?: number; to?: number; distance?: number; children: ReactNode; style?: StyleProp<ViewStyle>; rotate?: number }) {
  const s = useAnimatedStyle(() => {
    const p = interpolate(progress.value, [from, to], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: (1 - p) * distance }, { rotate: `${(1 - p) * rotate}deg` }, { scale: 0.96 + p * 0.04 }] };
  });
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}
