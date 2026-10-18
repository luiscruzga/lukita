import { useState } from 'react';
import { isDevAuth } from '@/auth';
import { DevSignIn } from '@/components/layout/DevSignIn';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/expo/legacy';
import { Mail } from 'lucide-react-native';
import { View } from 'react-native';
import { AuthFrame } from '@/components/layout/AuthFrame';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { Text } from '@/components/ui/Text';
import { PasswordMeter } from '@/components/profile/PasswordMeter';
import { useToast } from '@/components/ui/Toast';
import { clerkError } from '@/lib/clerkErrors';

export default function ForgotPassword() {
  if (isDevAuth) return <DevSignIn />;
  return <ForgotPasswordClerk />;
}

function ForgotPasswordClerk() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!isLoaded) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Escribe un correo válido.');
    setLoading(true);
    setError(null);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
      setStep('reset');
    } catch (e) {
      setError(clerkError(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!isLoaded) return;
    if (code.length !== 6) return setError('Escribe el código de 6 dígitos.');
    if (password.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    setError(null);
    try {
      const res = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code, password });
      if (res.status === 'complete' && res.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        toast.show({ kind: 'success', title: 'Contraseña actualizada', message: 'Ya iniciaste sesión con tu nueva contraseña.' });
        router.replace('/hoy');
      } else if (res.status === 'needs_second_factor') {
        setError('Contraseña cambiada. Inicia sesión para confirmar con tu segundo factor.');
        router.replace('/sign-in');
      }
    } catch (e) {
      setError(clerkError(e));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'reset') {
    return (
      <AuthFrame title="Crea una nueva contraseña" subtitle={`Escribe el código que enviamos a ${email} y tu nueva contraseña.`} back>
        <View style={{ alignItems: 'center' }}>
          <OtpInput value={code} onChange={setCode} />
        </View>
        <Input kind="new-password" label="Nueva contraseña" value={password} onChangeText={setPassword} />
        <PasswordMeter password={password} />
        <Input kind="new-password" label="Repite la contraseña" value={confirm} onChangeText={setConfirm} onSubmitEditing={reset} error={confirm && confirm !== password ? 'No coincide' : null} />
        {error ? (
          <Text variant="small" tone="coral">
            {error}
          </Text>
        ) : null}
        <Button label="Guardar contraseña" size="lg" fullWidth loading={loading} onPress={reset} />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Recupera tu acceso" subtitle="Te enviaremos un código para crear una contraseña nueva." back>
      <Input kind="email" label="Correo de tu cuenta" placeholder="tu@correo.cl" value={email} onChangeText={setEmail} icon={Mail} onSubmitEditing={send} />
      {error ? (
        <Text variant="small" tone="coral">
          {error}
        </Text>
      ) : null}
      <Button label="Enviar código" size="lg" fullWidth loading={loading} onPress={send} />
    </AuthFrame>
  );
}
