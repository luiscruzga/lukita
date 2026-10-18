/**
 * Punto único de autenticación de la app. Importa de aquí (`@/auth`) y no de `@clerk/expo`:
 * en modo local (sin Clerk configurado) se usan implementaciones de desarrollo.
 */
import { isDevAuth } from './devMode';
import * as clerk from './clerk';
import * as dev from './dev';

export type { AppUser, AuthState } from './types';
export { isDevAuth } from './devMode';

export const useAuth = isDevAuth ? dev.useAuth : clerk.useAuth;
export const useUser = isDevAuth ? dev.useUser : clerk.useUser;
export const useClerk = isDevAuth ? dev.useClerk : clerk.useClerk;
