import { isClerkAPIResponseError } from '@clerk/expo';

const MESSAGES: Record<string, string> = {
  form_identifier_not_found: 'No encontramos una cuenta con ese correo.',
  form_password_incorrect: 'La contraseña no es correcta.',
  form_password_pwned: 'Esa contraseña apareció en una filtración. Elige otra.',
  form_password_length_too_short: 'La contraseña debe tener al menos 8 caracteres.',
  form_password_validation_failed: 'La contraseña no cumple los requisitos.',
  form_identifier_exists: 'Ya existe una cuenta con ese correo. Inicia sesión.',
  form_code_incorrect: 'El código no es correcto. Revisa tu correo e inténtalo de nuevo.',
  verification_expired: 'El código expiró. Pide uno nuevo.',
  verification_failed: 'Demasiados intentos. Pide un código nuevo.',
  form_param_format_invalid: 'El formato no es válido.',
  too_many_requests: 'Demasiados intentos. Espera un momento y vuelve a probar.',
  session_exists: 'Ya tienes una sesión iniciada.',
  form_username_invalid_length: 'El nombre de usuario debe tener entre 4 y 64 caracteres.',
  form_identifier_exists__username: 'Ese nombre de usuario ya está en uso.',
};

/** Traduce los errores de Clerk a mensajes accionables en español. */
export function clerkError(e: unknown): string {
  if (isClerkAPIResponseError(e)) {
    const first = e.errors[0];
    return MESSAGES[first?.code ?? ''] ?? first?.longMessage ?? first?.message ?? 'No pudimos completar la acción.';
  }
  return (e as Error)?.message ?? 'No pudimos completar la acción.';
}
