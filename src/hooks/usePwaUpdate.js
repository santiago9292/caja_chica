import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para detección de nueva versión en PWA mediante ciclo de vida
 * del Service Worker (updatefound) y reactivación de pestaña (visibilitychange).
 * NUNCA recarga solo: únicamente recarga cuando el usuario presiona el botón.
 */
export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const registrationRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const checkWaitingWorker = (reg) => {
      if (reg && reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }
    };

    const attachRegistration = (reg) => {
      if (!reg) return;
      registrationRef.current = reg;

      // 1. Si ya hay un worker esperando en segundo plano
      checkWaitingWorker(reg);

      // 2. Escuchar updatefound para detectar nueva versión cuando se instala
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    };

    // Registrar o asociar el Service Worker
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      attachRegistration(reg);
    }).catch((err) => {
      console.warn('Error registrando Service Worker:', err);
    });

    // 3. Al volver a la pestaña (visibilitychange), consultar a Vercel si hay nueva versión
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && registrationRef.current) {
        registrationRef.current.update().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // IMPORTANTE: NO escuchar controllerchange para recargar automáticamente,
    // para evitar bucles de recarga continua. La recarga solo se dispara
    // explícitamente cuando el usuario pulsa en "Clic para actualizar".

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  /**
   * Solo recarga cuando el usuario hace clic en el botón de actualizar.
   * Limpia CacheStorage (sin tocar sesión ni localStorage) y recarga la página.
   */
  const applyUpdate = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }

      // Limpiar caché de Service Worker (CacheStorage)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // Pequeña pausa para permitir que el nuevo SW active sus hooks
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.warn('Error limpiando caché de SW:', e);
    } finally {
      // Recargar una única vez de forma intencional por acción del usuario
      window.location.reload();
    }
  }, [waitingWorker, isUpdating]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate, isUpdating };
}
