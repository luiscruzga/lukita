import { useState } from 'react';
import { isDevAuth } from '@/auth';
import { DevSignIn } from '@/components/layout/DevSignIn';
import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignUp } from '@clerk/expo/legacy';
import { MailCheck, Mail, User } from 'lucide-react-native';
import { AuthFrame } from '@/components/layout/AuthFrame';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { Text } from '@/components/ui/Text';
import { Pressable } from '@/components/ui/Pressable';
import { useTheme } from '@/theme/ThemeProvider';
import { clerkError } from '@/lib/clerkErrors';
import { PasswordMeter } from '@/components/profile/PasswordMeter';
import { ProtectCheck } from '@/components/auth/ProtectCheck';
import type { ProtectChallenge } from '@/components/auth/protectTypes';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  if (isDevAuth) return <DevSignIn />;
  return <SignUpClerk />;
}

function SignUpClerk() {
  const { colors } = useTheme();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | 'global', string>>>({});
  const [codeError, setCodeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protect, setProtect] = useState<{ challenge: ProtectChallenge; then: 'prepare' | 'finish' } | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  type SignUpRes = Awaited<ReturnType<NonNullable<typeof signUp>['create']>>;

  /**
   * Continúa el registro según el estado que devuelve Clerk. Si Clerk Protect (anti-bots) exige una
   * verificación (`missing_fields: ['protect_check']`), se muestra el desafío y al resolverlo se
   * envía el proof token; la respuesta puede traer otro desafío encadenado.
   */
  const advance = async (res: SignUpRes, then: 'prepare' | 'finish') => {
    if (res.protectCheck) {
      setProtect({ challenge: { token: res.protectCheck.token, sdkUrl: res.protectCheck.sdkUrl, uiHints: res.protectCheck.uiHints }, then });
      return;
    }
    setProtect(null);
    if (res.status === 'complete' && res.createdSessionId) {
      await setActive!({ session: res.createdSessionId });
      router.replace('/cuentas?onboarding=1');
      return;
    }
    if (then === 'prepare') {
      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
      return;
    }
    const missing = res.missingFields?.filter((f) => f !== 'protect_check') ?? [];
    setErrors({ global: missing.length ? `Falta completar: ${missing.join(', ')}.` : 'No pudimos terminar el registro. Inténtalo de nuevo.' });
  };

  const onProof = async (proofToken: string) => {
    if (!signUp || !protect) return;
    setLoading(true);
    try {
      const res = await signUp.submitProtectCheck({ proofToken });
      await advance(res, protect.then);
    } catch (err) {
      setProtect(null);
      setErrors({ global: clerkError(err) });
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!isLoaded) return;
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = 'Escribe tu nombre.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Escribe un correo válido.';
    if (form.password.length < 8) e.password = 'Usa al menos 8 caracteres.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const res = await signUp.create({ firstName: form.firstName.trim(), lastName: form.lastName.trim() || undefined, emailAddress: form.email.trim(), password: form.password });
      await advance(res, 'prepare');
    } catch (err) {
      setErrors({ global: clerkError(err) });
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    if (!isLoaded || value.length !== 6) return;
    setLoading(true);
    setCodeError(false);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code: value });
      await advance(res, 'finish');
    } catch (err) {
      setCodeError(true);
      setCode('');
      setErrors({ global: clerkError(err) });
    } finally {
      setLoading(false);
    }
  };

  if (protect) {
    return (
      <AuthFrame title="Un último paso" subtitle="Confirmamos que eres una persona para proteger tu cuenta." back>
        <ProtectCheck
          challenge={protect.challenge}
          onToken={onProof}
          onError={(m) => {
            setProtect(null);
            setErrors({ global: `No se pudo completar la verificación de seguridad: ${m}` });
          }}
        />
        {loading ? (
          <Text variant="small" tone="soft" align="center">
            Validando…
          </Text>
        ) : null}
      </AuthFrame>
    );
  }

  if (step === 'verify') {
    return (
      <AuthFrame title="Revisa tu correo" subtitle={`Escribe el código de 6 dígitos que enviamos a ${form.email}.`} back>
        <View style={{ alignItems: 'center', gap: 18 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: colors.coinSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MailCheck size={30} color={colors.ink} />
          </View>
          <OtpInput value={code} onChange={setCode} onComplete={verify} error={codeError} disabled={loading} />
          {errors.global ? (
            <Text variant="small" tone="coral" align="center">
              {errors.global}
            </Text>
          ) : null}
        </View>
        <Button label="Confirmar correo" size="lg" fullWidth loading={loading} disabled={code.length !== 6} onPress={() => verify()} />
        <Button variant="ghost" label="Reenviar código" fullWidth onPress={() => signUp?.prepareEmailAddressVerification({ strategy: 'email_code' }).catch((e) => setErrors({ global: clerkError(e) }))} />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Crea tu cuenta" subtitle="Elige tus bancos, tarjetas y clubes; nosotros buscamos dónde rinden más.">
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Input kind="name" label="Nombre" placeholder="Camila" value={form.firstName} onChangeText={set('firstName')} error={errors.firstName} icon={User} containerStyle={{ flex: 1 }} />
        <Input kind="name" label="Apellido" placeholder="Rojas" value={form.lastName} onChangeText={set('lastName')} containerStyle={{ flex: 1 }} />
      </View>
      <Input kind="email" label="Correo" placeholder="tu@correo.cl" value={form.email} onChangeText={set('email')} error={errors.email} icon={Mail} />
      <Input kind="new-password" label="Contraseña" placeholder="Mínimo 8 caracteres" value={form.password} onChangeText={set('password')} error={errors.password} onSubmitEditing={submit} />
      <PasswordMeter password={form.password} />
      {errors.global ? (
        <Text variant="small" tone="coral">
          {errors.global}
        </Text>
      ) : null}
      {/* Contenedor requerido por Clerk Bot Protection (CAPTCHA invisible) en web. */}
      <View nativeID="clerk-captcha" />
      <Button label="Crear cuenta" size="lg" fullWidth loading={loading} onPress={submit} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text tone="soft">¿Ya tienes cuenta?</Text>
        <Link href="/sign-in" asChild>
          <Pressable>
            <Text variant="bodyStrong" tone="primary">
              Inicia sesión
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthFrame>
  );
}
