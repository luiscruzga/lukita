export type Role = 'admin' | 'moderator' | 'partner' | 'user';

export type DiscountType = 'percent' | 'amount' | 'installments' | 'two_for_one' | 'cashback' | 'points' | 'special_price';
export type Channel = 'in_store' | 'online' | 'both';

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProviderCategory {
  id: string;
  name: string;
  icon: string;
  sort: number;
  provider_count?: number;
}

export interface ProviderProduct {
  id: string;
  provider_id: string;
  name: string;
  kind: 'credit' | 'debit' | 'prepaid' | 'account' | 'membership' | 'plan' | 'app';
  tier: string | null;
}

export interface Provider {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  domain: string | null;
  logo_url: string | null;
  brand_color: string | null;
  website: string | null;
  description: string | null;
  is_active?: boolean;
  products?: ProviderProduct[];
  discount_count?: number;
}

export type ProviderLite = Pick<Provider, 'id' | 'slug' | 'name' | 'domain' | 'logo_url' | 'brand_color' | 'category_id'>;

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  category: string;
  domain: string | null;
  logo_url: string | null;
  brand_color: string | null;
  location_count?: number;
}

export type MerchantLite = Pick<Merchant, 'id' | 'slug' | 'name' | 'domain' | 'logo_url' | 'brand_color' | 'category'>;

export interface Discount {
  id: string;
  title: string;
  description: string | null;
  discount_type: DiscountType;
  value: number | null;
  cap_amount: number | null;
  min_purchase: number | null;
  days_of_week: number[] | null;
  time_start: string | null;
  time_end: string | null;
  valid_from: string | null;
  valid_to: string | null;
  channel: Channel;
  category: string;
  terms: string | null;
  source_url: string | null;
  image_url: string | null;
  code: string | null;
  is_featured: boolean;
  is_active: boolean;
  regions: string[] | null;
  product_ids: string[] | null;
  provider: ProviderLite;
  merchant: MerchantLite | null;
  is_favorite?: boolean;
  location_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MerchantLocation {
  id: string;
  merchant_id: string;
  name: string | null;
  address: string | null;
  comuna: string | null;
  region: string | null;
  lat: number;
  lng: number;
}

export interface NearbyDiscount {
  discount_id: string;
  location_id: string;
  lat: number;
  lng: number;
  distance_m: number;
  address: string | null;
  comuna: string | null;
  title: string;
  discount_type: DiscountType;
  value: number | null;
  days_of_week: number[] | null;
  category: string;
  merchant: MerchantLite;
  provider: ProviderLite;
}

export interface UserAccount {
  provider_id: string;
  product_id: string | null;
  provider?: ProviderLite;
  product?: ProviderProduct | null;
}

export interface Profile {
  id: string;
  clerk_user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
  comuna: string | null;
  region: string | null;
  monthly_goal: number | null;
  created_at: string;
}

export interface SavingEntry {
  id: string;
  discount_id: string | null;
  provider_id: string | null;
  merchant_name: string | null;
  amount_spent: number;
  amount_saved: number;
  used_on: string;
  note: string | null;
  provider?: ProviderLite | null;
}

export interface SavingsStats {
  total_saved: number;
  month_saved: number;
  month_goal: number | null;
  entries: number;
  by_month: { month: string; saved: number }[];
  by_category: { category: string; saved: number }[];
  by_provider: { provider: ProviderLite; saved: number }[];
  by_weekday: { weekday: number; saved: number }[];
}

export interface CalendarDay {
  date: string;
  count: number;
  top: { id: string; title: string; value: number | null; discount_type: DiscountType; provider: ProviderLite }[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface AlertRule {
  kind: 'daily_digest' | 'nearby' | 'new_from_my_accounts' | 'expiring_favorites';
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface PaymentOption {
  provider: ProviderLite;
  discount: Pick<Discount, 'id' | 'title' | 'discount_type' | 'value' | 'cap_amount' | 'min_purchase' | 'days_of_week'>;
  estimated_saving: number;
  applies_today: boolean;
}

export interface AdminUser {
  id: string;
  clerk_user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  last_seen_at: string | null;
  account_count: number;
}

export type LocationsStatus = 'pending' | 'done' | 'none' | 'error';

/** Fila de Admin → Locales. */
export interface AdminMerchant {
  id: string;
  slug: string;
  name: string;
  category: string;
  domain: string | null;
  logo_url: string | null;
  brand_color: string | null;
  locations_status: LocationsStatus;
  locations_checked_at: string | null;
  locations: number;
  active_discounts: number;
  pending_addresses: number;
}

export interface MerchantLocation {
  id: string;
  name: string | null;
  address: string | null;
  comuna: string | null;
  region: string | null;
  lat: number;
  lng: number;
  source: 'manual' | 'address' | 'osm';
  external_ref: string | null;
  created_at: string;
}

export interface AdminMerchantDetail extends Omit<AdminMerchant, 'locations' | 'pending_addresses'> {
  locations_attempts: number;
  created_at: string;
  locations: MerchantLocation[];
  addresses: { id: string; address: string; comuna: string | null; region: string | null; status: 'pending' | 'failed'; error: string | null; geocoded_at: string | null }[];
}

export interface DiscountReport {
  id: string;
  reason: 'expired' | 'wrong_info' | 'not_applied' | 'other';
  comment: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  discount: Pick<Discount, 'id' | 'title'> & { provider: ProviderLite };
  reporter: { display_name: string | null; email: string | null } | null;
}

export interface AdminStats {
  users: number;
  users_7d: number;
  discounts_active: number;
  providers: number;
  merchants: number;
  locations: number;
  open_reports: number;
  savings_total: number;
  signups_by_week: { week: string; count: number }[];
  discounts_by_category: { category: string; count: number }[];
  top_providers: { provider: ProviderLite; count: number }[];
}
