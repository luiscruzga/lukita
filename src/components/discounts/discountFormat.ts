import type { Discount, DiscountType } from '@/types/domain';
import { compactCLP } from '@/lib/format';
import { toISODate } from '@/lib/dates';

/** Texto grande del cupón: "40%", "$5k", "6 cuotas", "2x1". */
export function discountHeadline(type: DiscountType, value: number | null): { big: string; small: string } {
  switch (type) {
    case 'percent':
      return { big: `${value ?? 0}%`, small: 'dcto.' };
    case 'amount':
      return { big: compactCLP(value ?? 0), small: 'de dcto.' };
    case 'installments':
      return { big: `${value ?? 3}`, small: 'cuotas s/i' };
    case 'two_for_one':
      return { big: '2x1', small: 'promo' };
    case 'cashback':
      return { big: `${value ?? 0}%`, small: 'cashback' };
    case 'points':
      return { big: `x${value ?? 2}`, small: 'puntos' };
    case 'special_price':
      if (value != null && Number(value) === 0) return { big: 'Gratis', small: '' };
      if (value == null) return { big: 'Precio', small: 'especial' };
      return { big: compactCLP(value), small: 'precio' };
    default:
      return { big: '—', small: '' };
  }
}

/** Titular en una línea: "40% dcto.", "Gratis", "Precio especial". */
export function headlineText(type: DiscountType, value: number | null) {
  const h = discountHeadline(type, value);
  return type === 'percent' || type === 'amount' ? h.big : `${h.big} ${h.small}`.trim();
}

export function appliesOn(d: Pick<Discount, 'days_of_week' | 'valid_from' | 'valid_to'>, date: Date) {
  const iso = toISODate(date);
  if (d.valid_from && iso < d.valid_from) return false;
  if (d.valid_to && iso > d.valid_to) return false;
  return !d.days_of_week || d.days_of_week.length === 0 || d.days_of_week.includes(date.getDay());
}

/** Ahorro estimado de un descuento para un monto de compra (respeta tope y compra mínima). */
export function estimateSaving(d: Pick<Discount, 'discount_type' | 'value' | 'cap_amount' | 'min_purchase'>, amount: number) {
  if (d.min_purchase && amount < d.min_purchase) return 0;
  let s = 0;
  if (d.discount_type === 'percent' || d.discount_type === 'cashback') s = (amount * (d.value ?? 0)) / 100;
  else if (d.discount_type === 'amount') s = d.value ?? 0;
  else if (d.discount_type === 'two_for_one') s = amount / 2;
  if (d.cap_amount) s = Math.min(s, d.cap_amount);
  return Math.round(Math.min(s, amount));
}
