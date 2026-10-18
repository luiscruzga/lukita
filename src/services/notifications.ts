import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '@/lib/api';
import { env } from '@/lib/env';

/**
 * Notificaciones nativas:
 * - Android/iOS: expo-notifications + Expo Push Service (FCM en Android vía google-services.json).
 * - Web: Push API estándar con service worker (`public/sw.js`) y claves VAPID.
 * El backend (apps/api) guarda el token/suscripción y envía los push.
 */

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
  });
}

export type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export async function getPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
    return Notification.permission as PushPermission;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default';
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#2B1FA8',
  });
  await Notifications.setNotificationChannelAsync('deals', {
    name: 'Descuentos cerca y del día',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#FFB81C',
  });
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerWeb(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  if (!env.vapidPublicKey) return true; // sin VAPID solo funcionan las notificaciones locales
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey) }));
  await api.post('/v1/me/push-tokens', { platform: 'web', subscription: sub.toJSON() });
  return true;
}

async function registerNative(): Promise<boolean> {
  if (!Device.isDevice) return false;
  await ensureAndroidChannels();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await api.post('/v1/me/push-tokens', { platform: Platform.OS, token });
  return true;
}

/** Pide permiso y registra este dispositivo/navegador. Devuelve false si el usuario no lo permite. */
export async function registerForPush(): Promise<boolean> {
  try {
    return Platform.OS === 'web' ? await registerWeb() : await registerNative();
  } catch (e) {
    console.warn('[push] registro fallido', e);
    return false;
  }
}

/** Notificación local inmediata (p. ej. al detectar un descuento cerca). */
export async function notifyLocal(title: string, body: string, data?: Record<string, unknown>) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(title, { body, data, icon: '/icon-192.png', badge: '/badge-72.png' });
    else new Notification(title, { body, icon: '/icon-192.png' });
    return;
  }
  await Notifications.scheduleNotificationAsync({ content: { title, body, data: data ?? {} }, trigger: null });
}

export function addNotificationListeners(onReceive: (n: { title: string; body: string; data: Record<string, unknown> }) => void, onOpen: (data: Record<string, unknown>) => void) {
  if (Platform.OS === 'web') {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'lukita-push') onReceive(e.data.payload);
      if (e.data?.type === 'lukita-open') onOpen(e.data.payload ?? {});
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }
  const a = Notifications.addNotificationReceivedListener((n) =>
    onReceive({ title: n.request.content.title ?? '', body: n.request.content.body ?? '', data: (n.request.content.data ?? {}) as Record<string, unknown> }),
  );
  const b = Notifications.addNotificationResponseReceivedListener((r) => onOpen((r.notification.request.content.data ?? {}) as Record<string, unknown>));
  return () => {
    a.remove();
    b.remove();
  };
}
