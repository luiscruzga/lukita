export interface ProtectChallenge {
  token: string;
  sdkUrl: string;
  uiHints?: Record<string, string>;
}

export interface ProtectCheckProps {
  challenge: ProtectChallenge;
  onToken: (proofToken: string) => void;
  onError: (message: string) => void;
}

/** Mismas validaciones que Clerk: solo módulos HTTPS sin credenciales en la URL. */
export function validSdkUrl(sdkUrl: string): string | null {
  try {
    const u = new URL(sdkUrl);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}
