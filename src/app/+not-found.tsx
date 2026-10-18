import { router } from 'expo-router';
import { MapPinOff } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Screen>
      <EmptyState icon={MapPinOff} title="Esta página no existe" message="El enlace puede estar mal escrito o el descuento ya no está publicado." action={<Button label="Volver al inicio" onPress={() => router.replace('/')} />} />
    </Screen>
  );
}
