import { useMemo } from 'react';
import { useAuth as useClerkAuth, useClerk as useClerkClerk, useUser as useClerkUser } from '@clerk/expo';
import type { AppUser, AuthState } from './types';
import type { Role } from '@/types/domain';

const ROLES: Role[] = ['admin', 'moderator', 'partner', 'user'];

export function useAuth(): AuthState {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  return useMemo(() => ({ isLoaded, isSignedIn: !!isSignedIn, getToken: () => getToken() }), [isLoaded, isSignedIn, getToken]);
}

/** Adapta el UserResource de Clerk a la interfaz AppUser. */
export function useUser(): { isLoaded: boolean; isSignedIn: boolean; user: AppUser | null } {
  const { isLoaded, isSignedIn, user: u } = useClerkUser();
  const user = useMemo<AppUser | null>(() => {
    if (!u) return null;
    const raw = (u.publicMetadata as { role?: string } | null)?.role;
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: u.fullName,
      username: u.username,
      imageUrl: u.imageUrl,
      email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? null,
      passwordEnabled: u.passwordEnabled,
      role: ROLES.includes(raw as Role) ? (raw as Role) : 'user',
      update: async (p) => {
        await u.update(p);
      },
      setProfileImage: async (p) => {
        await u.setProfileImage(p);
      },
      updatePassword: async (p) => {
        await u.updatePassword(p);
      },
      reload: async () => {
        await u.reload();
      },
    };
  }, [u]);
  return { isLoaded, isSignedIn: !!isSignedIn, user };
}

export function useClerk() {
  const { signOut } = useClerkClerk();
  return { signOut: () => signOut() };
}
