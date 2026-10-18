import { useEffect } from 'react';
import { useAuth } from '@/auth';
import { useQueryClient } from '@tanstack/react-query';
import { setTokenGetter } from '@/lib/api';

/** Conecta el cliente HTTP con la sesión de Clerk y limpia la caché al cerrar sesión. */
export function ApiAuthBridge() {
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);
  useEffect(() => {
    if (!isSignedIn) qc.removeQueries({ queryKey: ['me'] });
  }, [isSignedIn, qc]);
  return null;
}
