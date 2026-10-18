import { useEffect, useState } from 'react';

/** Devuelve `v` solo cuando deja de cambiar durante `ms` (para búsquedas mientras se escribe). */
export function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}
