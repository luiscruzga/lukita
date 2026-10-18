import type { Role } from '@/types/domain';

/** Subconjunto del usuario de Clerk que usa la app. Lo implementan Clerk (adaptado) y el modo local. */
export interface AppUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  username: string | null;
  imageUrl: string;
  email: string | null;
  passwordEnabled: boolean;
  role: Role;
  update(params: { firstName?: string; lastName?: string; username?: string }): Promise<void>;
  setProfileImage(params: { file: string }): Promise<void>;
  updatePassword(params: { currentPassword?: string; newPassword: string; signOutOfOtherSessions?: boolean }): Promise<void>;
  reload(): Promise<void>;
}

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken(): Promise<string | null>;
}
