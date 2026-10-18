import { useEffect, useMemo } from 'react';
import { useDevStore } from './devStore';
import type { AppUser, AuthState } from './types';

/** Implementación local de los hooks de autenticación (sin Clerk). Ver devMode.ts. */
export function useAuth(): AuthState {
  const { loaded, session, load } = useDevStore();
  useEffect(() => {
    load();
  }, [load]);
  return useMemo(() => ({ isLoaded: loaded, isSignedIn: !!session, getToken: async () => (session ? `dev:${session.role}` : null) }), [loaded, session]);
}

export function useUser(): { isLoaded: boolean; isSignedIn: boolean; user: AppUser | null } {
  const { loaded, session, patch } = useDevStore();
  const user = useMemo<AppUser | null>(() => {
    if (!session) return null;
    return {
      id: `user_dev${session.role}`,
      firstName: session.firstName,
      lastName: session.lastName,
      fullName: `${session.firstName} ${session.lastName}`.trim(),
      username: session.username,
      imageUrl: session.imageUrl,
      email: `${session.role}@lukita.local`,
      passwordEnabled: true,
      role: session.role,
      update: (p) => patch({ firstName: p.firstName ?? session.firstName, lastName: p.lastName ?? session.lastName, username: p.username ?? session.username }),
      setProfileImage: ({ file }) => patch({ imageUrl: file }),
      updatePassword: async () => undefined,
      reload: async () => undefined,
    };
  }, [session, patch]);
  return { isLoaded: loaded, isSignedIn: !!session, user };
}

export function useClerk() {
  const signOut = useDevStore((s) => s.signOut);
  return { signOut };
}
