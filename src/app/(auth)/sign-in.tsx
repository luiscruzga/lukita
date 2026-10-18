import { useState } from 'react';
import { isDevAuth } from '@/auth';
import { DevSignIn } from '@/components/layout/DevSignIn';
import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSignIn } from '@clerk/expo/legacy';
import { useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { AuthFrame } from '@/components/layout/AuthFrame';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { Text } from '@/components/ui/Text';
import { Pressable } from '@/components/ui/Pressable';
import { useTheme } from '@/theme/ThemeProvider';
import { clerkError } from '@/lib/clerkErrors';
import { ProtectCheck } from '@/components/auth/ProtectCheck';
import type { ProtectChallenge } from '@/components/auth/protectTypes';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  if (isDevAuth) return <DevSignIn />;
  return <SignInClerk />;
}

function SignInClerk() {
  const { colors } = useTheme();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeTarget, setCodeTarget] = useState<string | null>(null);
  const [protect, setProtect] = useState<ProtectChallenge | null>(null);

  const finish = async (sessionId: string | null) => {
    if (!sessionId) throw new Error('No se pudo crear la sesión.');
    await setActive!({ session: sessionId });
    router.replace('/hoy');
  };

  const submit = async () => {
    if (!isLoaded) return;
    if (!EMAIL_RE.test(email.trim())) return setError('Escribe un correo válido.');
    if (!password) return setError('Escribe tu contraseña.');
    setError(null);
    setLoading(true);
    try {
      const res = await signIn.create({ identifier: email.trim(), password });
      await advance(res);
    } catch (e) {
      setError(clerkError(e));
    } finally {
      setLoading(false);
    }
  };

  type SignInRes = Awaited<ReturnType<NonNullable<typeof signIn>['create']>>;

  /** Continúa el inicio de sesión según el estado: sesión lista, desafío anti-bots o código de verificación. */
  const advance = async (res: SignInRes) => {
    if (res.status === 'needs_protect_check' && res.protectCheck) {
      setProtect({ token: res.protectCheck.token, sdkUrl: res.protectCheck.sdkUrl, uiHints: res.protectCheck.uiHints });
      return;
    }
    setProtect(null);
    {
      if (res.status === 'complete') return await finish(res.createdSessionId);
      // Confirmación del login con código: segundo factor o dispositivo nuevo (Device Trust).
      if (res.status === 'needs_second_factor' || res.status === 'needs_client_trust') {
        const factor = res.supportedSecondFactors?.find((f) => f.strategy === 'email_code') ?? res.supportedSecondFactors?.[0];
        if (factor?.strategy === 'email_code') {
          await signIn!.prepareSecondFactor({ strategy: 'email_code', emailAddressId: (factor as { emailAddressId?: string }).emailAddressId });
          setCodeTarget((factor as { safeIdentifier?: string }).safeIdentifier ?? email);
        } else if (factor?.strategy === 'phone_code') {
          await signIn!.prepareSecondFactor({ strategy: 'phone_code' });
          setCodeTarget((factor as { safeIdentifier?: string }).safeIdentifier ?? 'tu teléfono');
        } else setCodeTarget('tu app de autenticación');
        setStep('code');
        return;
      }
      setError('Tu cuenta requiere un paso adicional que no está soportado aquí.');
    }
  };

  const onProof = async (proofToken: string) => {
    if (!signIn) return;
    setLoading(true);
    try {
      await advance(await signIn.submitProtectCheck({ proofToken }));
    } catch (e) {
      setProtect(null);
      setError(clerkError(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    if (!isLoaded || value.length !== 6) return;
    setLoading(true);
    setCodeError(false);
    try {
      const factor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code') ?? signIn.supportedSecondFactors?.[0];
      const strategy = (factor?.strategy ?? 'email_code') as 'email_code' | 'phone_code' | 'totp';
      const res = await signIn.attemptSecondFactor({ strategy, code: value });
      if (res.status === 'complete' || res.status === 'needs_protect_check') await advance(res);
      else setError('Falta un paso para completar el inicio de sesión.');
    } catch (e) {
      setCodeError(true);
      setError(clerkError(e));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive: activate } = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: Linking.createURL('/hoy') });
      if (createdSessionId && activate) {
        await activate({ session: createdSessionId });
        router.replace('/hoy');
      }
    } catch (e) {
      setError(clerkError(e));
    } finally {
      setLoading(false);
    }
  };

  if (protect) {
    return (
      <AuthFrame title="Un último paso" subtitle="Confirmamos que eres una persona para proteger tu cuenta." back>
        <ProtectCheck
          challenge={protect}
          onToken={onProof}
          onError={(m) => {
            setProtect(null);
            setError(`No se pudo completar la verificación de seguridad: ${m}`);
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

  if (step === 'code') {
    return (
      <AuthFrame title="Confirma que eres tú" subtitle={`Enviamos un código de 6 dígitos a ${codeTarget}.`} back>
        <View style={{ alignItems: 'center', gap: 18 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={30} color={colors.primary} />
          </View>
          <OtpInput value={code} onChange={setCode} onComplete={verify} error={codeError} disabled={loading} />
          {error ? (
            <Text variant="small" tone="coral" align="center">
              {error}
            </Text>
          ) : null}
        </View>
        <Button label="Verificar e ingresar" size="lg" fullWidth loading={loading} disabled={code.length !== 6} onPress={() => verify()} />
        <Button
          variant="ghost"
          label="Reenviar código"
          fullWidth
          onPress={async () => {
            try {
              await signIn?.prepareSecondFactor({ strategy: 'email_code' });
              setError(null);
            } catch (e) {
              setError(clerkError(e));
            }
          }}
        />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Hola de nuevo" subtitle="Entra para ver los descuentos de tus cuentas de hoy.">
      <Input kind="email" label="Correo" placeholder="tu@correo.cl" value={email} onChangeText={setEmail} icon={Mail} returnKeyType="next" />
      <Input kind="password" label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} onSubmitEditing={submit} returnKeyType="go" />
      <Link href="/forgot-password" asChild>
        <Pressable style={{ alignSelf: 'flex-end' }}>
          <Text variant="smallStrong" tone="primary">
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>
      </Link>
      {error ? (
        <Text variant="small" tone="coral" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Button label="Iniciar sesión" size="lg" fullWidth loading={loading} onPress={submit} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        <Text variant="caption" tone="muted">
          o
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      </View>
      <Button variant="secondary" label="Continuar con Google" size="lg" fullWidth onPress={google} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text tone="soft">¿Primera vez?</Text>
        <Link href="/sign-up" asChild>
          <Pressable>
            <Text variant="bodyStrong" tone="primary">
              Crea tu cuenta
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthFrame>
  );
}
