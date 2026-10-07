import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para detección de nueva versión en PWA mediante ciclo de vida
 * del Service Worker (updatefound) y reactivación de pestaña (visibilitychange).
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

    const attachRegistration = (reg) => {
      if (!reg) return;
      registrationRef.current = reg;

      // 1. Si ya hay un worker esperando en segundo plano (waiting)
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      // 2. Escuchar updatefound para detectar nueva versión en proceso de instalación
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // Cuando se completa la instalación del nuevo worker y ya había una versión activa
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    };

    // Verificar si ya existe registro activo o registrar el Service Worker
    navigator.serviceWorker.getRegistration().then((existingReg) => {
      if (existingReg) {
        attachRegistration(existingReg);
      }
    });

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      attachRegistration(reg);
    }).catch((err) => {
      console.warn('Error registrando Service Worker:', err);
    });

    // 3. Detectar cuando el usuario retoma la pestaña o aplicación (visibilitychange)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        if (registrationRef.current) {
          registrationRef.current.update().catch((err) => {
            console.debug('Error al verificar actualización de SW:', err);
          });
        } else {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              registrationRef.current = reg;
              reg.update().catch(() => {});
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 4. Si el controller cambia después de activar el nuevo SW, recargar limpiamente
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  /**
   * Aplica la actualización: activa el nuevo Service Worker, limpia la caché
   * de red (CacheStorage) sin tocar localStorage ni sessionStorage (no cierra sesión)
   * y recarga la página para cargar la versión más reciente de Vercel.
   */
  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      // 1. Indicar al nuevo Service Worker que tome el control inmediato
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }

      // 2. Limpiar todos los cachés HTTP (CacheStorage)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // 3. Forzar actualización en todos los registros
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          await r.update().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Error limpiando caché de SW:', e);
    } finally {
      // 4. Recargar la página fresca
      window.location.reload();
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate, isUpdating };
}
