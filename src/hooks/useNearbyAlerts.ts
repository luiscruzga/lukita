import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { todayISO } from '@/lib/dates';
import { useAlerts } from './queries';
import { getPushPermission, notifyLocal } from '@/services/notifications';
import { watchPosition, type Coords } from '@/services/location';
import { useAppStore } from '@/stores/useAppStore';
import type { NearbyDiscount } from '@/types/domain';

const KEY = '@lukita/nearby-notified';
const MIN_INTERVAL_MS = 5 * 60_000;

/**
 * Alerta "descuentos cerca" mientras la app está abierta: al moverse, busca descuentos de hoy de
 * las cuentas del usuario a menos del radio configurado y avisa una sola vez por local y día.
 */
export function useNearbyAlerts() {
  const alerts = useAlerts();
  const setLocation = useAppStore((s) => s.setLocation);
  const status = useAppStore((s) => s.locationStatus);
  const last = useRef(0);
  const rule = alerts.data?.find((r) => r.kind === 'nearby');
  const enabled = !!rule?.enabled && status === 'granted';
  const radius = Number(rule?.config?.radius ?? 300);

  useEffect(() => {
    if (!enabled) return;
    let stop = () => undefined as void;
    const check = async (c: Coords) => {
      setLocation(c, 'granted');
      if (Date.now() - last.current < MIN_INTERVAL_MS) return;
      last.current = Date.now();
      if ((await getPushPermission()) !== 'granted') return;
      const res = await api.get<{ data: NearbyDiscount[] }>('/v1/discounts/nearby', { lat: c.lat, lng: c.lng, radius, mine: 'true', day: new Date().getDay(), limit: 20 }).catch(() => null);
      const best = res?.data?.[0];
      if (!best) return;
      const seen = await storage.get<Record<string, string>>(KEY, {});
      const key = best.location_id;
      if (seen[key] === todayISO()) return;
      await storage.set(KEY, { ...Object.fromEntries(Object.entries(seen).filter(([, d]) => d === todayISO())), [key]: todayISO() });
      await notifyLocal(`Estás cerca de ${best.merchant.name}`, `${best.title} con ${best.provider.name}`, { discountId: best.discount_id });
    };
    watchPosition(check).then((s) => (stop = s));
    return () => stop();
  }, [enabled, radius, setLocation]);
}
