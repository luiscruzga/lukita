import { AlertTriangle, CheckCircle2, CircleSlash, Clock, type LucideIcon } from 'lucide-react-native';
import { Badge } from '@/components/ui/Chip';
import type { LocationsStatus } from '@/types/domain';

/** Estado de la búsqueda de locales de un comercio (worker de OpenStreetMap). */
export const LOCATIONS_STATUS: Record<LocationsStatus, { label: string; tone: 'mint' | 'sky' | 'neutral' | 'coral'; icon: LucideIcon }> = {
  done: { label: 'Con locales', tone: 'mint', icon: CheckCircle2 },
  pending: { label: 'En cola', tone: 'sky', icon: Clock },
  none: { label: 'Sin resultado', tone: 'neutral', icon: CircleSlash },
  error: { label: 'Con error', tone: 'coral', icon: AlertTriangle },
};

export function LocationsStatusBadge({ status }: { status: LocationsStatus }) {
  const s = LOCATIONS_STATUS[status];
  return <Badge label={s.label} tone={s.tone} icon={s.icon} />;
}
