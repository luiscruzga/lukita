/* Service worker de Lukita: recibe Web Push y abre la app al tocar la notificación. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = { title: 'Lukita', body: 'Tienes descuentos nuevos', data: {} };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) => c.postMessage({ type: 'lukita-push', payload }));
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        data: payload.data,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: payload.data && payload.data.tag ? payload.data.tag : undefined,
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || (data.discountId ? `/descuento/${data.discountId}` : '/hoy');
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = clients.find((c) => 'focus' in c);
      if (open) {
        open.postMessage({ type: 'lukita-open', payload: data });
        return open.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
