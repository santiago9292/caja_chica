import React, { useState, useEffect } from 'react';
import { store } from './lib/store';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { FormularioIngreso } from './components/FormularioIngreso';
import { ModuloAprobacion } from './components/ModuloAprobacion';
import { MaestroDni } from './components/MaestroDni';
import { MaestroCategorias } from './components/MaestroCategorias';
import { ModuloArqueo } from './components/ModuloArqueo';
import { ModuloReportes } from './components/ModuloReportes';
import { MisSolicitudes } from './components/MisSolicitudes';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { playNotificationSound } from './lib/audioNotifier';
import OneSignal from 'react-onesignal';
import { buildNotifUrl, resolveTabForEvent, consumeNotifFromUrl } from './lib/notifRouting';

export function App() {
  const [usuarios, setUsuarios] = useState(store.usuarios);
  const [categorias, setCategorias] = useState(store.categorias);
  const [solicitudes, setSolicitudes] = useState(store.solicitudes);
  const [cajaFondo, setCajaFondo] = useState(store.cajaFondo);
  const [notificaciones, setNotificaciones] = useState(store.notificaciones);
  
  // Usuario en sesión
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('caja_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Pestaña actual
  const [currentTab, setCurrentTab] = useState('nuevo');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isOneSignalInitialized, setIsOneSignalInitialized] = useState(false);

  // Destino pendiente al abrir la app desde una notificación (?notif=EVENTO&sol=DNI)
  const [pendingNotif, setPendingNotif] = useState(() => consumeNotifFromUrl());

  // NOTA: El Service Worker lo registra ÚNICAMENTE OneSignal (OneSignalSDKWorker.js).
  // Registrarlo también desde la app con otra URL provocaba falsas "nuevas versiones"
  // en bucle. Las actualizaciones se aplican solas (skipWaiting + Network First).

  // Inicializar OneSignal
  useEffect(() => {
    const initOneSignal = async () => {
      if (window.__onesignal_initialized) return;
      try {
        await OneSignal.init({
          appId: "c50fba12-7b4e-45e9-8bc5-63d9639a2b53",
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
          // Al hacer clic: reutilizar la ventana abierta de la app y llevarla a la URL de la notificación
          notificationClickHandlerMatch: "origin",
          notificationClickHandlerAction: "navigate",
          notifyButton: {
            enable: true,
          },
        });
        window.__onesignal_initialized = true;
        setIsOneSignalInitialized(true);

        // Si la app ya estaba abierta y OneSignal solo la enfoca, cambiar de pestaña aquí
        OneSignal.Notifications.addEventListener('click', (event) => {
          try {
            const url = event?.result?.url || event?.notification?.launchURL;
            if (!url) return;
            const params = new URL(url).searchParams;
            const evento = params.get('notif');
            if (evento) setPendingNotif({ evento, sol: params.get('sol') || '' });
          } catch (e) {}
        });

        OneSignal.Slidedown.promptPush();
      } catch (e) {
        // En localhost o por restricción de dominio de OneSignal
        console.info("OneSignal push notification status:", e.message || e);
        // Respaldo: si OneSignal no pudo registrar el SW, registrarlo para soporte offline
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration('/').then((reg) => {
            if (!reg) navigator.serviceWorker.register('/OneSignalSDKWorker.js').catch(() => {});
          }).catch(() => {});
        }
      }
    };
    initOneSignal();
  }, []);

  // Vincular el dispositivo al DNI del usuario
  useEffect(() => {
    if (!isOneSignalInitialized) return;
    
    if (currentUser && currentUser.dni) {
      const vincular = async () => {
        try {
          // Asegurar que el DNI sea string para que funcione correctamente como external_id en múltiples dispositivos
          await OneSignal.login(String(currentUser.dni));
        } catch (e) {
          console.warn("OneSignal login error:", e);
        }
        // Auto-reparación: si hay permiso pero la suscripción push se perdió
        // (p. ej. tras desregistrar el Service Worker), volver a suscribir el dispositivo.
        try {
          const sub = OneSignal.User?.PushSubscription;
          const permiso = OneSignal.Notifications?.permission;
          if (sub && permiso && (!sub.optedIn || !sub.id || !sub.token)) {
            await sub.optIn();
          }
        } catch (e) {
          console.warn("OneSignal re-suscripción error:", e);
        }
      };
      vincular();
    } else {
      try {
        OneSignal.logout();
      } catch (e) {}
    }
  }, [currentUser, isOneSignalInitialized]);

  // Llevar al usuario a la pestaña que corresponde a la notificación pulsada
  useEffect(() => {
    if (!pendingNotif || !currentUser) return; // Si no hay sesión, se aplica tras el login
    const tab = resolveTabForEvent(currentUser, pendingNotif.evento, pendingNotif.sol);
    if (tab) setCurrentTab(tab);
    setPendingNotif(null);
  }, [pendingNotif, currentUser]);

  // Mensajes del Service Worker (clic en notificación local con la app abierta)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const onSwMessage = (event) => {
      if (event.data?.type === 'NOTIF_NAV' && event.data.evento) {
        setPendingNotif({ evento: event.data.evento, sol: event.data.sol || '' });
      }
    };
    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, []);

  const fireNativeNotification = (title, body, evento = null, solicitanteDni = '') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const url = evento ? buildNotifUrl(evento, solicitanteDni) : '/';
    // Fallback sin Service Worker: al hacer clic, enfocar y navegar dentro de la app
    const showBasic = () => {
      const n = new Notification(title, { body, icon: '/icon-192.svg' });
      n.onclick = () => {
        window.focus();
        if (evento) setPendingNotif({ evento, sol: solicitanteDni || '' });
        n.close();
      };
    };

    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/icon-192.svg',
              badge: '/icon-192.svg',
              tag: 'caja-chica-notif-' + Date.now(),
              renotify: true,
              data: { __cajaLocal: true, url, evento, sol: solicitanteDni || '' }
            });
          }).catch(() => {
            showBasic();
          });
        } else {
          showBasic();
        }
      } catch (e) {
        console.warn('Error mostrando notificación nativa:', e);
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          try {
            showBasic();
          } catch (e) {}
        }
      }).catch(() => {});
    }
  };

  // Solicitar permiso de notificaciones para Administradores en PC
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [currentUser]);

  // Suscripción al store reactivo en tiempo real y sondeo continuo
  useEffect(() => {
    // Descargar datos iniciales desde Supabase al abrir la PWA
    store.getCajaFondo();
    store.getUsuarios();
    store.getCategorias();
    store.getSolicitudes();

    const unsubscribe = store.subscribe((meta) => {
      setUsuarios([...store.usuarios]);
      setCategorias([...store.categorias]);
      setSolicitudes([...store.solicitudes]);
      setCajaFondo({ ...store.cajaFondo });
      setNotificaciones([...store.notificaciones]);

      if (!currentUser) return; // No mostrar alertas si no hay sesión activa

      const isAdmin = currentUser.roles?.includes('ADMINISTRADOR') || currentUser.roles?.includes('SYSADMIN');

      // Nueva Solicitud -> Solo notificar a los Administradores
      if (meta?.type === 'SOLICITUD_CREATED' && meta.solicitud) {
        if (isAdmin) {
          const title = 'Nueva Solicitud Registrada';
          const msg = `${meta.solicitud.solicitante_nombre} registró ${meta.solicitud.codigo} por S/ ${Number(meta.solicitud.monto).toFixed(2)}`;
          showToast({ title, message: msg, type: 'warning' });
          playNotificationSound('alert');
          fireNativeNotification(title, msg, 'NUEVA_SOLICITUD', meta.solicitud.solicitante_dni);
        }
      } 
      // Cambio de estado
      else if (meta?.type === 'SOLICITUD_STATUS_CHANGED' && meta.solicitud) {
        if (meta.estado === 'PENDIENTE_REEMBOLSO') {
          if (isAdmin) {
            const title = `Reembolso por Autorizar: ${meta.solicitud.codigo}`;
            const msg = `${meta.solicitud.solicitante_nombre} rindió con exceso. Autoriza el reembolso en Bandeja de Aprobaciones.`;
            showToast({ title, message: msg, type: 'warning' });
            playNotificationSound('alert');
            fireNativeNotification(title, msg, 'REEMBOLSO_PENDIENTE', meta.solicitud.solicitante_dni);
          }
        } else if (meta.estado === 'POR_DEVOLVER' && currentUser.roles?.includes('USUARIO') && currentUser.dni !== meta.solicitud.solicitante_dni) {
          const title = `Devolución por Recibir: ${meta.solicitud.codigo}`;
          const msg = `${meta.solicitud.solicitante_nombre} rindió con sobrante. Confirma la recepción del efectivo en Arqueo & Balance.`;
          showToast({ title, message: msg, type: 'warning' });
          playNotificationSound('alert');
          fireNativeNotification(title, msg, 'DEVOLUCION_PENDIENTE', meta.solicitud.solicitante_dni);
        } else if (currentUser.dni === meta.solicitud.solicitante_dni) {
          const title = `Solicitud ${meta.estado}: ${meta.solicitud.codigo}`;
          const isPagado = meta.estado === 'PAGADO';
          const isPorReembolsar = meta.estado === 'POR_REEMBOLSAR';
          const isPorDevolver = meta.estado === 'POR_DEVOLVER';
          const isRendido = meta.estado === 'RENDIDO';
          const msg = isPorReembolsar
            ? `Tu reembolso fue aprobado por el administrador. Acércate a Caja Chica para cobrar.`
            : isPorDevolver
            ? `Rendición registrada con sobrante. Acércate a Caja a devolver el efectivo no utilizado.`
            : isRendido
            ? `Tu rendición quedó conforme.`
            : isPagado 
            ? `Tu solicitud fue abonada por el cajero ${meta.solicitud.pagado_por_nombre}`
            : `La solicitud fue ${meta.estado.toLowerCase()} por ${meta.solicitud.aprobado_por_nombre}`;
          const isPositivo = meta.estado === 'APROBADO' || isPagado || isPorReembolsar || isRendido;
          showToast({ title, message: msg, type: isPositivo ? 'success' : isPorDevolver ? 'warning' : 'danger' });
          playNotificationSound(isPositivo ? 'success' : isPorDevolver ? 'alert' : 'reject');
          fireNativeNotification(title, msg, meta.estado, meta.solicitud.solicitante_dni);
        }
      }
    });

    // Auto-actualización al retomar ventana y sondeo de respaldo periódico cada 15s
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        store.getSolicitudes();
        store.getCajaFondo();
      }
    };
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    const pollInterval = setInterval(() => {
      store.getSolicitudes();
      store.getCajaFondo();
    }, 15000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(pollInterval);
    };
  }, [currentUser]);

  // Actualizar usuario en sesión si sus datos o roles cambiaron en el maestro
  useEffect(() => {
    if (currentUser) {
      const freshUser = usuarios.find(u => u.dni === currentUser.dni);
      if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(freshUser);
        localStorage.setItem('caja_current_user', JSON.stringify(freshUser));
      }
    }
  }, [usuarios]);

  // Selección automática de la pestaña inicial según los roles del usuario al iniciar sesión
  const setInitialTabForUser = (user) => {
    const roles = user.roles || [];
    if (roles.includes('ADMINISTRADOR')) {
      setCurrentTab('aprobaciones');
    } else if (roles.includes('SOLICITANTE')) {
      setCurrentTab('nuevo');
    } else if (roles.includes('SYSADMIN')) {
      setCurrentTab('maestro_dni');
    } else {
      setCurrentTab('arqueo');
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('caja_current_user', JSON.stringify(user));
    setInitialTabForUser(user);
    showToast({
      title: `Bienvenido, ${user.nombres}`,
      message: `Sesión iniciada con roles: ${user.roles.join(', ')}`,
      type: 'info'
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('caja_current_user');
  };

  const showToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleCreateSolicitud = async (solData) => {
    return await store.createSolicitud(solData);
  };

  const handleUpdateEstado = async (id, estado, observaciones, extraData = {}) => {
    return await store.updateEstadoSolicitud(id, estado, currentUser, observaciones, extraData);
  };

  const handleRendirAdelanto = async (id, comprobantes) => {
    return await store.rendirAdelanto(id, comprobantes);
  };

  const handleSaveUsuario = async (userData) => {
    return await store.saveUsuario(userData);
  };

  const handleToggleActivo = async (dni) => {
    return await store.toggleUsuarioActivo(dni);
  };

  const handleSaveCategoria = async (catData) => {
    return await store.saveCategoria(catData);
  };

  const handleToggleCategoriaActiva = async (id) => {
    return await store.toggleCategoriaActiva(id);
  };

  const handleDeleteCategoria = async (id) => {
    return await store.deleteCategoria(id);
  };

  const handleMarcarLeidas = () => {
    store.marcarNotificacionesLeidas();
  };

  const pendientesCount = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_REEMBOLSO').length;

  return (
    <div className="app-container">
      
      {/* Si no hay usuario en sesión, mostrar Login por DNI */}
      {!currentUser ? (
        <LoginModal 
          onLogin={handleLogin} 
          usuarios={usuarios} 
        />
      ) : (
        <>
          {/* Barra Superior de Navegación y Roles */}
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            pendientesCount={pendientesCount}
            notificaciones={notificaciones.filter(n => 
              n.usuario_dni === 'TODOS' || 
              (n.usuario_dni === 'ADMINS' && (currentUser?.roles?.includes('ADMINISTRADOR') || currentUser?.roles?.includes('SYSADMIN'))) || 
              n.usuario_dni === currentUser?.dni
            )}
            onMarcarLeidas={handleMarcarLeidas}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Vistas según la pestaña activa */}
          <main style={{ marginTop: '0.5rem' }}>
            {currentTab === 'nuevo' && (
              <FormularioIngreso
                currentUser={currentUser}
                categorias={categorias}
                onSubmitSolicitud={handleCreateSolicitud}
                onSuccessTab={() => setCurrentTab('mis_solicitudes')}
              />
            )}

            {currentTab === 'mis_solicitudes' && (
              <MisSolicitudes
                currentUser={currentUser}
                solicitudes={solicitudes}
                onRendirAdelanto={handleRendirAdelanto}
              />
            )}

            {currentTab === 'aprobaciones' && (
              <ModuloAprobacion
                currentUser={currentUser}
                solicitudes={solicitudes}
                onUpdateEstado={handleUpdateEstado}
              />
            )}

            {currentTab === 'arqueo' && (
              <ModuloArqueo
                currentUser={currentUser}
                cajaFondo={cajaFondo}
                solicitudes={solicitudes}
                onUpdateEstado={handleUpdateEstado}
                onAsignarFondo={async (monto) => await store.updateFondoAsignado(monto)}
                onReponerFondo={async (monto) => await store.reponerFondo(monto)}
              />
            )}

            {currentTab === 'maestro_dni' && (
              <MaestroDni
                currentUser={currentUser}
                usuarios={usuarios}
                onSaveUsuario={handleSaveUsuario}
                onToggleActivo={handleToggleActivo}
              />
            )}

            {currentTab === 'maestro_categorias' && (
              <MaestroCategorias
                currentUser={currentUser}
                categorias={categorias}
                onSaveCategoria={handleSaveCategoria}
                onToggleActivo={handleToggleCategoriaActiva}
                onDeleteCategoria={handleDeleteCategoria}
              />
            )}

            {currentTab === 'reportes' && (
              <ModuloReportes
                currentUser={currentUser}
                solicitudes={solicitudes}
                cajaFondo={cajaFondo}
                categorias={categorias}
                onLiquidarSolicitudes={async (data) => await store.liquidarSolicitudesBatch({ ...data, adminUser: currentUser })}
              />
            )}
          </main>
        </>
      )}

      {/* Modal de Configuración Supabase */}
      <SupabaseConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Contenedor de Toasts Flotantes en Tiempo Real */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="toast-item"
            style={{
              borderLeft: `4px solid ${
                t.type === 'success' ? '#10b981' :
                t.type === 'danger' ? '#ef4444' :
                t.type === 'warning' ? '#f59e0b' : '#38bdf8'
              }`
            }}
          >
            <div style={{ marginTop: '2px' }}>
              {t.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
              {t.type === 'danger' && <AlertTriangle size={18} color="#ef4444" />}
              {t.type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
              {t.type === 'info' && <Info size={18} color="#38bdf8" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.message}</div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter(item => item.id !== t.id))}
              style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
export default App;
