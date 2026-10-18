import { env } from '@/lib/env';

/**
 * Modo local sin Clerk: se activa solo si NO hay publishable key y estamos en desarrollo
 * (o se fuerza con EXPO_PUBLIC_DEV_AUTH=true). La API solo acepta estos tokens con DEV_AUTH=true
 * y NODE_ENV distinto de production, así que nunca sirve contra un backend real.
 */
export const isDevAuth = !env.clerkKey && (process.env.EXPO_PUBLIC_DEV_AUTH === 'true' || (typeof __DEV__ !== 'undefined' && __DEV__));
