import { useUser } from '@/auth';
import type { Role } from '@/types/domain';

/** Rol desde publicMetadata de Clerk (fuente de verdad; la API lo sincroniza con Supabase). */
export function useRole(): { role: Role; is: (...r: Role[]) => boolean } {
  const { user } = useUser();
  const role: Role = user?.role ?? 'user';
  return { role, is: (...r) => r.includes(role) };
}
