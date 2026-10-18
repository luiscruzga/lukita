import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Check, ChevronDown, ChevronUp, Save } from 'lucide-react-native';
import { useAccounts, useCategories, useProviders, useSaveAccounts } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Pressable } from '@/components/ui/Pressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogProvider';
import { BrandLogo } from '@/components/brand/BrandLogo';
import type { Provider } from '@/types/domain';

type Selection = Record<string, Set<string | null>>; // provider_id -> product ids (null = sin producto específico)

export default function Cuentas() {
  const { colors } = useTheme();
  const { columns } = useBreakpoint();
  const params = useLocalSearchParams<{ onboarding?: string }>();
  const toast = useToast();
  const dialog = useDialog();
  const categories = useCategories();
  const accounts = useAccounts();
  const save = useSaveAccounts();
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const providers = useProviders({ category, q: q || undefined, pageSize: 100, withProducts: true });
  const [sel, setSel] = useState<Selection>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!accounts.data) return;
    const s: Selection = {};
    accounts.data.forEach((a) => {
      s[a.provider_id] = s[a.provider_id] ?? new Set();
      s[a.provider_id].add(a.product_id);
    });
    setSel(s);
  }, [accounts.data]);

  const count = Object.keys(sel).length;
  const toggleProvider = (p: Provider) => {
    setDirty(true);
    setSel((s) => {
      const n = { ...s };
      if (n[p.id]) delete n[p.id];
      else n[p.id] = new Set([null]);
      return n;
    });
  };
  const toggleProduct = (p: Provider, productId: string) => {
    setDirty(true);
    setSel((s) => {
      const cur = new Set(s[p.id] ?? []);
      cur.delete(null);
      cur.has(productId) ? cur.delete(productId) : cur.add(productId);
      const n = { ...s };
      n[p.id] = cur.size ? cur : new Set([null]);
      return n;
    });
  };

  const persist = async () => {
    const list = Object.entries(sel).flatMap(([provider_id, set]) => [...set].map((product_id) => ({ provider_id, product_id })));
    try {
      await save.mutateAsync(list);
      setDirty(false);
      toast.show({ kind: 'success', title: 'Cuentas guardadas', message: `${count} ${count === 1 ? 'cuenta' : 'cuentas'} conectadas a tus descuentos.` });
      if (params.onboarding) router.replace('/hoy');
    } catch (e) {
      dialog.alert({ title: 'No pudimos guardar', message: (e as Error).message, tone: 'danger' });
    }
  };

  const list = providers.data?.data ?? [];
  const cols = Math.min(columns + 1, 4);
  const grouped = useMemo(() => list, [list]);

  return (
    <View style={{ flex: 1 }}>
      <Screen topInset={false} contentStyle={{ gap: 16, paddingBottom: 180 }}>
        <View style={{ gap: 4 }}>
          <Text variant="h1">{params.onboarding ? '¿Qué cuentas tienes?' : 'Mis cuentas'}</Text>
          <Text tone="soft">Marca tus bancos, tarjetas, cajas de compensación, compañías de teléfono, apps de bencina y clubes. Solo verás los descuentos que puedes usar.</Text>
        </View>
        <Input kind="search" placeholder="Buscar banco, farmacia, caja…" value={q} onChangeText={setQ} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Todas" selected={!category} onPress={() => setCategory(null)} />
          {(categories.data ?? []).map((c) => (
            <Chip key={c.id} label={c.name} selected={category === c.id} onPress={() => setCategory(category === c.id ? null : c.id)} count={c.provider_count} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {providers.isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={{ width: `${100 / cols}%`, padding: 6 }}>
                  <Skeleton height={84} radius={20} />
                </View>
              ))
            : grouped.map((p) => {
                const on = !!sel[p.id];
                const open = expanded === p.id;
                return (
                  <View key={p.id} style={{ width: `${100 / cols}%`, padding: 6 }}>
                    <View style={{ borderRadius: radius.lg, borderWidth: 2, borderColor: on ? p.brand_color ?? colors.primary : colors.line, backgroundColor: colors.surface, overflow: 'hidden' }}>
                      <Pressable onPress={() => toggleProvider(p)} haptic pressScale={0.97} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                        <BrandLogo name={p.name} domain={p.domain} logoUrl={p.logo_url} color={p.brand_color} size={44} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text variant="bodyStrong" numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text variant="caption" tone="muted">
                            {p.discount_count ? `${p.discount_count} descuentos` : 'Sin descuentos aún'}
                          </Text>
                        </View>
                        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: on ? p.brand_color ?? colors.primary : colors.lineStrong, backgroundColor: on ? p.brand_color ?? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {on ? (
                            <Animated.View entering={ZoomIn.springify()}>
                              <Check size={15} color="#fff" strokeWidth={3} />
                            </Animated.View>
                          ) : null}
                        </View>
                      </Pressable>
                      {on && (p.products?.length ?? 0) > 0 ? (
                        <Animated.View entering={FadeIn} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
                          <Pressable onPress={() => setExpanded(open ? null : p.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text variant="caption" tone="soft">
                              {[...sel[p.id]].filter(Boolean).length ? `${[...sel[p.id]].filter(Boolean).length} productos elegidos` : '¿Qué tarjeta o plan tienes? (opcional)'}
                            </Text>
                            {open ? <ChevronUp size={16} color={colors.inkSoft} /> : <ChevronDown size={16} color={colors.inkSoft} />}
                          </Pressable>
                          {open ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                              {p.products!.map((pr) => (
                                <Chip key={pr.id} size="sm" label={pr.name} selected={sel[p.id].has(pr.id)} onPress={() => toggleProduct(p, pr.id)} />
                              ))}
                            </View>
                          ) : null}
                        </Animated.View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
        </View>
      </Screen>
      {dirty || params.onboarding ? (
        <Animated.View entering={FadeIn} style={{ position: 'absolute', left: 16, right: 16, bottom: 100, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.ink, borderRadius: radius.xl, paddingVertical: 10, paddingLeft: 20, paddingRight: 10, maxWidth: 520, width: '100%' }}>
            <Text variant="bodyStrong" style={{ color: colors.bg, flex: 1 }}>
              {count} {count === 1 ? 'cuenta elegida' : 'cuentas elegidas'}
            </Text>
            <Button variant="coin" icon={Save} label={params.onboarding ? 'Ver mis descuentos' : 'Guardar'} loading={save.isPending} onPress={persist} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
