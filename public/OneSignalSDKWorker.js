// Listener para forzar activación inmediata cuando el usuario hace clic en actualizar
// IMPORTANTE: DEBE ESTAR ARRIBA DE TODO, ANTES DE ONESIGNAL PARA QUE NO INTERCEPTE EL EVENTO
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Importar OneSignal Web SDK en el Service Worker raíz para compatibilidad y evitar error [WM]
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
  // Ignorar si se ejecuta offline o sin OneSignal
}

// Service Worker para PWA Caja Chica DICAR LOGISTIC
const CACHE_NAME = 'caja-chica-v6.0.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-dicar.png',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  // Activar la nueva versión de inmediato (sin quedar en "waiting" ni pedir al usuario)
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // No interceptar peticiones a Supabase, OneSignal ni APIs dinámicas
  if (
    url.pathname.startsWith('/api') || 
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('onesignal.com')
  ) {
    return;
  }

  // Estrategia Network First para TODOS los recursos (HTML, JS, CSS, assets)
  // Esto garantiza que los usuarios SIEMPRE reciban la última versión desplegada en Vercel
  // y solo se recurra a la caché si la red falla o están desconectados.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Listener para notificaciones push en segundo plano
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      // Las notificaciones de OneSignal (traen "custom") ya las muestra su SDK: evitar duplicados
      if (data && data.custom) return;
      const options = {
        body: data.mensaje || data.body || 'Nueva actividad en Caja Chica DICAR',
        icon: '/logo-dicar.png',
        badge: '/icon-192.svg',
        vibrate: [150, 50, 150],
        tag: 'caja-chica-push-' + Date.now(),
        renotify: true,
        data: {
          url: data.url || '/'
        }
      };
      event.waitUntil(
        self.registration.showNotification(data.titulo || data.title || 'Caja Chica DICAR LOGISTIC', options)
      );
    } catch (e) {
      console.warn('Error parseando push data:', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      let client = null;
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].focused) {
          client = clientList[i];
          break;
        }
      }
      if (!client && clientList.length > 0) {
        client = clientList[0];
      }

      if (client) {
        client.focus();
        if (notifData.evento) {
          client.postMessage({ type: 'NOTIF_NAV', evento: notifData.evento, sol: notifData.sol || '' });
        } else if (notifData.url && notifData.url !== '/') {
          client.navigate(notifData.url);
        }
        return;
      }

      return clients.openWindow(targetUrl);
    })
  );
});
