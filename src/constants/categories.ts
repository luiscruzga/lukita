import { Car, Coffee, GraduationCap, HeartPulse, Home, Plane, ShoppingBag, ShoppingCart, Sparkles, Ticket, Truck, Wrench, type LucideIcon } from 'lucide-react-native';

/** Rubros de los comercios / descuentos. El id coincide con discounts.category en Supabase. */
export const DISCOUNT_CATEGORIES: { id: string; name: string; icon: LucideIcon }[] = [
  { id: 'food', name: 'Restaurantes y café', icon: Coffee },
  { id: 'grocery', name: 'Supermercados', icon: ShoppingCart },
  { id: 'fuel', name: 'Combustible', icon: Car },
  { id: 'health', name: 'Salud y farmacia', icon: HeartPulse },
  { id: 'shopping', name: 'Tiendas y moda', icon: ShoppingBag },
  { id: 'travel', name: 'Viajes', icon: Plane },
  { id: 'entertainment', name: 'Entretención', icon: Ticket },
  { id: 'delivery', name: 'Delivery', icon: Truck },
  { id: 'wellness', name: 'Belleza y bienestar', icon: Sparkles },
  { id: 'home', name: 'Hogar', icon: Home },
  { id: 'education', name: 'Educación', icon: GraduationCap },
  { id: 'services', name: 'Servicios', icon: Wrench },
];

export const categoryName = (id?: string | null) => DISCOUNT_CATEGORIES.find((c) => c.id === id)?.name ?? 'Otros';
export const categoryIcon = (id?: string | null) => DISCOUNT_CATEGORIES.find((c) => c.id === id)?.icon ?? Sparkles;

export const DISCOUNT_TYPE_LABEL: Record<string, string> = {
  percent: 'Porcentaje',
  amount: 'Monto fijo',
  installments: 'Cuotas sin interés',
  two_for_one: '2x1',
  cashback: 'Cashback',
  points: 'Puntos',
  special_price: 'Precio especial',
};

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  partner: 'Comercio aliado',
  user: 'Usuario',
};
