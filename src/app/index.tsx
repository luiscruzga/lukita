import { useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { Extrapolation, FadeIn, FadeInDown, interpolate, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ArrowDownToLine, BellRing, ChevronDown, LogIn, MapPinned, PiggyBank, Wallet } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Logo, Wordmark } from '@/components/brand/Logo';
import { LukitaLoader } from '@/components/brand/LukitaLoader';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Pressable } from '@/components/ui/Pressable';
import { AreaChart } from '@/components/charts';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LandingScroll, Reveal, ScrollSection } from '@/components/landing/scroll';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { Marquee } from '@/components/landing/Marquee';
import { PinMap } from '@/components/landing/PinMap';
import { DEMO_WEEK, FAQ, PROVIDERS_A, PROVIDERS_B } from '@/components/landing/data';
import { UpdateService } from '@/services/updateService';
import { formatCLP } from '@/lib/format';

export default function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LukitaLoader fullscreen />;
  // En la app nativa la landing solo se muestra a quien no ha iniciado sesión.
  if (isSignedIn && Platform.OS !== 'web') return <Redirect href="/hoy" />;
  return <LandingPage signedIn={!!isSignedIn} />;
}

function LandingPage({ signedIn }: { signedIn: boolean }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { isPhone, isDesktop, width } = useBreakpoint();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const pad = isPhone ? 20 : 40;
  const max = { width: '100%' as const, maxWidth: 1200, alignSelf: 'center' as const, paddingHorizontal: pad };
  const navBg = useAnimatedStyle(() => ({ backgroundColor: isDark ? `rgba(16,14,46,${interpolate(y.value, [0, 80], [0, 0.92], Extrapolation.CLAMP)})` : `rgba(244,245,251,${interpolate(y.value, [0, 80], [0, 0.92], Extrapolation.CLAMP)})`, borderBottomWidth: interpolate(y.value, [0, 80], [0, 1], Extrapolation.CLAMP) }));
  const heroText = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * 0.35 }], opacity: interpolate(y.value, [0, 420], [1, 0], Extrapolation.CLAMP) }));
  const cta = () => router.push(signedIn ? '/hoy' : '/sign-up');

  return (
    <LandingScroll.Provider value={{ y, vh: height }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: insets.bottom }}>
          {/* HERO */}
          <View style={{ minHeight: Math.max(height, 640), paddingTop: insets.top + 96, justifyContent: 'center', overflow: 'hidden' }}>
            <View style={[max, { flexDirection: isDesktop ? 'row' : 'column', alignItems: 'center', gap: 32 }]}>
              <Animated.View style={[{ flex: 1, gap: 22 }, heroText]}>
                <Animated.View entering={FadeInDown.duration(600)}>
                  <Text variant="hero" style={{ fontSize: isPhone ? 46 : isDesktop ? 84 : 64, lineHeight: isPhone ? 48 : isDesktop ? 84 : 66, letterSpacing: isPhone ? -1.6 : -3 }}>
                    Tus cuentas ya tienen descuentos.
                  </Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(120).duration(600)}>
                  <Text variant="h3" tone="soft" style={{ maxWidth: 560, fontFamily: 'InstrumentSans_500Medium', fontSize: isPhone ? 19 : 22, lineHeight: isPhone ? 27 : 31 }}>
                    Marca tu banco, tu caja de compensación, tu compañía de teléfono y tu app de bencina. Lukita junta todos sus beneficios y te muestra cuáles usar hoy y dónde.
                  </Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(240).duration(600)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <Button size="lg" variant="coin" label={signedIn ? 'Ir a mis descuentos' : 'Crear mi cuenta gratis'} onPress={cta} />
                  <Button size="lg" variant="secondary" icon={ArrowDownToLine} label="App para Android" onPress={() => UpdateService.openReleasePage()} />
                </Animated.View>
                <Animated.View entering={FadeIn.delay(500)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {PROVIDERS_A.slice(0, 5).map((p, i) => (
                      <View key={p.name} style={{ marginLeft: i ? -10 : 0 }}>
                        <BrandLogo name={p.name} domain={p.domain} color={p.color} size={32} shape="circle" />
                      </View>
                    ))}
                  </View>
                  <Text variant="small" tone="soft">
                    Más de 70 bancos, cajas, telcos y clubes de Chile
                  </Text>
                </Animated.View>
              </Animated.View>
              <HeroVisual size={isPhone ? Math.min(width - 40, 360) : isDesktop ? 500 : 440} />
            </View>
            <ScrollHint y={y} />
          </View>

          {/* MARQUEE */}
          <View style={{ gap: 12, paddingVertical: 24 }}>
            <Marquee items={PROVIDERS_A} speed={36} />
            <Marquee items={PROVIDERS_B} reverse speed={30} />
          </View>

          {/* PASOS */}
          <ScrollSection style={[max, { paddingVertical: 80, gap: 32 }]} id="como-funciona">
            {(p) => (
              <>
                <Reveal progress={p} from={0.02} to={0.22}>
                  <Text variant="h1" style={{ fontSize: isPhone ? 34 : 48, lineHeight: isPhone ? 38 : 52, maxWidth: 720 }}>
                    Tres pasos y dejas de pagar precio completo.
                  </Text>
                </Reveal>
                <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
                  {[
                    { icon: Wallet, t: 'Elige tus cuentas', d: 'Bancos, tarjetas de casas comerciales, cajas de compensación, isapres, telcos, apps de bencina y clubes. Sin claves ni números de tarjeta.' },
                    { icon: MapPinned, t: 'Mira qué usar hoy', d: 'Cada día ves los descuentos que aplican, ordenados por lo que más rinde, y en el mapa los locales cercanos con su logo.' },
                    { icon: PiggyBank, t: 'Registra lo que ahorras', d: 'Anota cada compra con descuento y mira en gráficos cuántas lukitas llevas este mes y qué cuenta te conviene más.' },
                  ].map((s, i) => (
                    <Reveal key={s.t} progress={p} from={0.08 + i * 0.06} to={0.3 + i * 0.06} style={{ flex: 1 }} rotate={i % 2 ? 3 : -3}>
                      <View style={{ backgroundColor: i === 1 ? colors.primary : colors.surface, borderRadius: radius.xl, padding: 26, gap: 14, borderWidth: i === 1 ? 0 : 1, borderColor: colors.line, minHeight: 240 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: i === 1 ? colors.coin : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={26} color={i === 1 ? colors.onCoin : colors.primary} />
                          </View>
                          <Text variant="number" style={{ color: i === 1 ? colors.onPrimary : colors.lineStrong, fontSize: 56, lineHeight: 58 }}>
                            {i + 1}
                          </Text>
                        </View>
                        <Text variant="h3" style={{ color: i === 1 ? colors.onPrimary : colors.ink }}>
                          {s.t}
                        </Text>
                        <Text style={{ color: i === 1 ? colors.onPrimary : colors.inkSoft, opacity: i === 1 ? 0.85 : 1 }}>{s.d}</Text>
                      </View>
                    </Reveal>
                  ))}
                </View>
              </>
            )}
          </ScrollSection>

          {/* MAPA */}
          <ScrollSection style={{ backgroundColor: colors.surface, paddingVertical: 80 }}>
            {(p) => (
              <View style={[max, { flexDirection: isDesktop ? 'row' : 'column', gap: 40, alignItems: 'center' }]}>
                <View style={{ flex: 1, gap: 16 }}>
                  <Reveal progress={p} from={0.05} to={0.25}>
                    <Text variant="h1" style={{ fontSize: isPhone ? 34 : 48, lineHeight: isPhone ? 38 : 52 }}>
                      Todos tus descuentos alrededor, con el logo de cada tienda.
                    </Text>
                  </Reveal>
                  <Reveal progress={p} from={0.1} to={0.3}>
                    <Text tone="soft" style={{ fontSize: 18, lineHeight: 28 }}>
                      Activa tu ubicación y Lukita pinta el mapa con los locales donde tus cuentas tienen descuento hoy. Filtra por distancia, rubro o día, y toca un pin para ver el detalle.
                    </Text>
                  </Reveal>
                  <Reveal progress={p} from={0.14} to={0.34} style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    {['500 m', '1 km', '3 km', 'Hoy', 'Mis cuentas'].map((c, i) => (
                      <View key={c} style={{ paddingHorizontal: 14, height: 34, borderRadius: 999, justifyContent: 'center', backgroundColor: i === 2 || i === 4 ? colors.primary : colors.bg, borderWidth: 1, borderColor: colors.line }}>
                        <Text variant="smallStrong" style={{ color: i === 2 || i === 4 ? colors.onPrimary : colors.ink }}>
                          {c}
                        </Text>
                      </View>
                    ))}
                  </Reveal>
                </View>
                <View style={{ flex: 1.2, width: '100%' }}>
                  <PinMap progress={p} height={isPhone ? 320 : 420} />
                </View>
              </View>
            )}
          </ScrollSection>

          {/* SEMANA INTERACTIVA */}
          <ScrollSection style={[max, { paddingVertical: 80, gap: 24 }]}>{(p) => <WeekDemo progress={p} />}</ScrollSection>

          {/* AHORRO */}
          <ScrollSection style={{ backgroundColor: colors.primary, paddingVertical: 80 }}>
            {(p) => (
              <View style={[max, { flexDirection: isDesktop ? 'row' : 'column', gap: 32, alignItems: 'center' }]}>
                <View style={{ flex: 1, gap: 12 }}>
                  <Text variant="h3" style={{ color: colors.onPrimary, opacity: 0.8 }}>
                    Una familia que usa sus descuentos puede ahorrar
                  </Text>
                  <Counter progress={p} to={186400} />
                  <Text style={{ color: colors.onPrimary, opacity: 0.8, fontSize: 18, lineHeight: 28, maxWidth: 520 }}>
                    al año, solo combinando bencina los jueves, farmacia con su caja de compensación y comida con la tarjeta del banco. Ejemplo ilustrativo.
                  </Text>
                </View>
                <Reveal progress={p} from={0.15} to={0.4} style={{ flex: 1, width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20 }}>
                  <Text variant="title">Ahorro mensual</Text>
                  <AreaChart data={['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'].map((l, i) => ({ label: l, value: [8, 11, 9.5, 14, 16, 13, 18.5, 21][i] * 1000 }))} format={formatCLP} height={220} color={colors.mint} />
                </Reveal>
              </View>
            )}
          </ScrollSection>

          {/* ALERTAS */}
          <ScrollSection style={[max, { paddingVertical: 80 }]}>
            {(p) => (
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 32, alignItems: 'center' }}>
                <View style={{ flex: 1, gap: 12 }}>
                  <Reveal progress={p}>
                    <Text variant="h1" style={{ fontSize: isPhone ? 34 : 48, lineHeight: isPhone ? 38 : 52 }}>
                      Te avisa antes de que pagues de más.
                    </Text>
                  </Reveal>
                  <Reveal progress={p} from={0.1} to={0.32}>
                    <Text tone="soft" style={{ fontSize: 18, lineHeight: 28 }}>
                      Resumen diario a tu hora, aviso cuando pasas cerca de un local con descuento y recordatorio cuando un favorito está por vencer. En Android y en el navegador.
                    </Text>
                  </Reveal>
                </View>
                <View style={{ flex: 1, gap: 12, width: '100%' }}>
                  {[
                    { t: 'Hoy martes tienes 12 descuentos', b: 'El mejor: 40% en sushi con tu tarjeta Banco de Chile.' },
                    { t: 'Estás a 200 m de Copec', b: '$100 de descuento por litro con tu app, solo hoy jueves.' },
                    { t: 'Tu favorito vence mañana', b: '2x1 en cine con Entel. ¿Vamos?' },
                  ].map((n, i) => (
                    <Reveal key={n.t} progress={p} from={0.12 + i * 0.07} to={0.32 + i * 0.07} distance={60}>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.line, marginLeft: isDesktop ? i * 28 : 0 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.coin, alignItems: 'center', justifyContent: 'center' }}>
                          <BellRing size={20} color={colors.onCoin} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="smallStrong">{n.t}</Text>
                          <Text variant="caption" tone="soft">
                            {n.b}
                          </Text>
                        </View>
                      </View>
                    </Reveal>
                  ))}
                </View>
              </View>
            )}
          </ScrollSection>

          {/* FAQ */}
          <View style={[max, { paddingVertical: 60, gap: 16, maxWidth: 860 }]} nativeID="preguntas">
            <Text variant="h1" style={{ fontSize: isPhone ? 32 : 44, lineHeight: isPhone ? 36 : 48 }}>
              Preguntas frecuentes
            </Text>
            {FAQ.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </View>

          {/* CTA FINAL */}
          <View style={[max, { paddingVertical: 40 }]}>
            <View style={{ backgroundColor: colors.coin, borderRadius: radius.xl, padding: isPhone ? 28 : 56, gap: 20, overflow: 'hidden' }}>
              <Text variant="hero" style={{ color: colors.onCoin, fontSize: isPhone ? 40 : 64, lineHeight: isPhone ? 42 : 64, maxWidth: 760 }}>
                Cada luka cuenta. Empieza a juntarlas hoy.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <Button size="lg" label={signedIn ? 'Ir a mis descuentos' : 'Crear mi cuenta gratis'} onPress={cta} />
                <Button size="lg" variant="secondary" icon={ArrowDownToLine} label="Descargar APK" onPress={() => UpdateService.openReleasePage()} />
              </View>
            </View>
          </View>

          {/* FOOTER */}
          <View style={[max, { paddingVertical: 40, gap: 16, flexDirection: isPhone ? 'column' : 'row', justifyContent: 'space-between' }]}>
            <View style={{ gap: 8, maxWidth: 420 }}>
              <Wordmark size={30} />
              <Text variant="caption" tone="muted">
                Lukita no está afiliada a los bancos ni comercios mencionados. Las marcas pertenecen a sus dueños. Revisa siempre las condiciones en el sitio oficial de cada beneficio.
              </Text>
            </View>
            <Text variant="caption" tone="muted">
              © {new Date().getFullYear()} Lukita · Hecho en Chile
            </Text>
          </View>
        </Animated.ScrollView>

        {/* NAV */}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, borderBottomColor: colors.line }, navBg]}>
          <View style={[max, { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Logo size={36} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ThemeToggle />
              {signedIn ? (
                <Button label="Abrir Lukita" onPress={() => router.push('/hoy')} />
              ) : (
                <>
                  {!isPhone ? <Button variant="ghost" icon={LogIn} label="Entrar" onPress={() => router.push('/sign-in')} /> : null}
                  <Button label={isPhone ? 'Entrar' : 'Crear cuenta'} onPress={() => router.push(isPhone ? '/sign-in' : '/sign-up')} />
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </LandingScroll.Provider>
  );
}

function ScrollHint({ y }: { y: SharedValue<number> }) {
  const { colors } = useTheme();
  const s = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, 120], [1, 0], Extrapolation.CLAMP) }));
  return (
    <Animated.View style={[{ alignItems: 'center', marginTop: 24 }, s]}>
      <ChevronDown size={26} color={colors.inkMuted} />
    </Animated.View>
  );
}

function Counter({ progress, to }: { progress: SharedValue<number>; to: number }) {
  const { colors } = useTheme();
  const { isPhone } = useBreakpoint();
  const [n, setN] = useState(0);
  useAnimatedReaction(
    () => Math.round(interpolate(progress.value, [0.1, 0.45], [0, to], Extrapolation.CLAMP) / 100) * 100,
    (v, prev) => {
      if (v !== prev) scheduleOnRN(setN, v);
    },
  );
  return (
    <Text variant="hero" style={{ color: colors.coin, fontSize: isPhone ? 60 : 96, lineHeight: isPhone ? 64 : 98, letterSpacing: -3 }}>
      {formatCLP(n)}
    </Text>
  );
}

function WeekDemo({ progress }: { progress: SharedValue<number> }) {
  const { colors } = useTheme();
  const { isPhone } = useBreakpoint();
  const [day, setDay] = useState((new Date().getDay() + 6) % 7);
  const d = DEMO_WEEK[day];
  return (
    <>
      <Reveal progress={progress}>
        <Text variant="h1" style={{ fontSize: isPhone ? 34 : 48, lineHeight: isPhone ? 38 : 52, maxWidth: 760 }}>
          Cada día de la semana rinde distinto. Tócalos.
        </Text>
      </Reveal>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {DEMO_WEEK.map((w, i) => (
          <Pressable key={w.day} onPress={() => setDay(i)} haptic pressScale={0.92} style={{ width: isPhone ? 44 : 72, height: isPhone ? 54 : 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: i === day ? colors.coin : colors.surface, borderWidth: 1.5, borderColor: i === day ? colors.coin : colors.line }} accessibilityRole="tab" accessibilityState={{ selected: i === day }}>
            <Text variant={isPhone ? 'smallStrong' : 'title'} style={{ color: i === day ? colors.onCoin : colors.ink }}>
              {w.day}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: isPhone ? 'column' : 'row', gap: 14 }}>
        {d.items.map((it, i) => (
          <Animated.View key={`${day}-${i}`} entering={FadeInDown.delay(i * 80).springify().damping(15)} style={{ flex: 1, flexDirection: 'row', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ width: 110, backgroundColor: i === 0 ? colors.primary : colors.coin, alignItems: 'center', justifyContent: 'center', paddingVertical: 22 }}>
              <Text variant="h1" style={{ color: i === 0 ? colors.onPrimary : colors.onCoin }}>
                {it.v}
              </Text>
            </View>
            <View style={{ flex: 1, padding: 18, gap: 6, justifyContent: 'center', borderLeftWidth: 2, borderStyle: 'dashed', borderLeftColor: colors.lineStrong }}>
              <Text variant="title">{it.m}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: it.color }} />
                <Text variant="small" tone="soft">
                  con {it.p}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
      <Text variant="caption" tone="muted">
        Ejemplos ilustrativos. En la app verás los descuentos reales y vigentes de tus cuentas.
      </Text>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const rot = useAnimatedStyle(() => ({ transform: [{ rotate: open ? '180deg' : '0deg' }] }));
  return (
    <Pressable onPress={() => setOpen((o) => !o)} pressScale={0.995} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: open ? colors.primary : colors.line, padding: 20, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="title" style={{ flex: 1 }}>
          {q}
        </Text>
        <Animated.View style={rot}>
          <ChevronDown size={20} color={colors.inkSoft} />
        </Animated.View>
      </View>
      {open ? (
        <Animated.View entering={FadeInDown.duration(220)}>
          <Text tone="soft">{a}</Text>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}
