import { Bell, CalendarDays, Compass, Database, Gauge, Heart, Map, MapPinned, PiggyBank, Sun, Store, User, Users, Wallet, Flag, Ticket, type LucideIcon } from 'lucide-react-native';
import type { Role } from '@/types/domain';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const MAIN_NAV: NavItem[] = [
  { href: '/hoy', label: 'Hoy', icon: Sun },
  { href: '/explorar', label: 'Explorar', icon: Compass },
  { href: '/mapa', label: 'Mapa', icon: Map },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/cuentas', label: 'Mis cuentas', icon: Wallet },
  { href: '/ahorro', label: 'Mi ahorro', icon: PiggyBank },
  { href: '/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/notificaciones', label: 'Alertas', icon: Bell },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Panel', icon: Gauge, roles: ['admin', 'moderator'] },
  { href: '/admin/descuentos', label: 'Descuentos', icon: Ticket, roles: ['admin', 'moderator', 'partner'] },
  { href: '/admin/proveedores', label: 'Proveedores', icon: Store, roles: ['admin'] },
  { href: '/admin/reportes', label: 'Reportes', icon: Flag, roles: ['admin', 'moderator'] },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
  { href: '/admin/locales', label: 'Locales', icon: MapPinned, roles: ['admin'] },
  { href: '/admin/ingesta', label: 'Ingesta', icon: Database, roles: ['admin'] },
];

/** Pestañas inferiores en teléfono; el resto vive en el menú "Más". */
export const TAB_NAV = ['/hoy', '/explorar', '/mapa', '/ahorro'];
