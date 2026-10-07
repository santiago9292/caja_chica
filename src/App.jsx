import React, { useState, useEffect } from 'react';
import { store } from './lib/store';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { FormularioIngreso } from './components/FormularioIngreso';
import { ModuloAprobacion } from './components/ModuloAprobacion';
import { MaestroDni } from './components/MaestroDni';
import { ModuloArqueo } from './components/ModuloArqueo';
import { ModuloReportes } from './components/ModuloReportes';
import { MisSolicitudes } from './components/MisSolicitudes';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { playNotificationSound } from './lib/audioNotifier';
import OneSignal from 'react-onesignal';

export function App() {
  const [usuarios, setUsuarios] = useState(store.usuarios);
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

  // Inicializar OneSignal
  useEffect(() => {
    try {
      OneSignal.init({
        appId: "c50fba12-7b4e-45e9-8bc5-63d9639a2b53",
        allowLocalhostAsSecureOrigin: true,
      });
    } catch (e) {
      console.warn("OneSignal init error:", e);
    }
  }, []);

  // Vincular el dispositivo al DNI del usuario
  useEffect(() => {
    if (currentUser && currentUser.dni) {
      try {
        OneSignal.login(currentUser.dni);
      } catch (e) {
        console.warn("OneSignal login error:", e);
      }
    } else {
      try {
        OneSignal.logout();
      } catch (e) {}
    }
  }, [currentUser]);

  const fireNativeNotification = (title, body) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, { body, icon: '/icon-192.svg' });
          }).catch(() => {
            new Notification(title, { body, icon: '/icon-192.svg' });
          });
        } else {
          new Notification(title, { body, icon: '/icon-192.svg' });
        }
      } catch (e) {
        console.warn('Error mostrando notificación nativa:', e);
      }
    }
  };

  // Suscripción al store reactivo en tiempo real
  useEffect(() => {
    // Descargar datos iniciales desde Supabase al abrir la PWA
    store.getCajaFondo();
    store.getUsuarios();
    store.getSolicitudes();

    const unsubscribe = store.subscribe((meta) => {
      setUsuarios([...store.usuarios]);
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
          fireNativeNotification(title, msg);
        }
      } 
      // Cambio de estado -> Solo notificar al Solicitante original
      else if (meta?.type === 'SOLICITUD_STATUS_CHANGED' && meta.solicitud) {
        if (currentUser.dni === meta.solicitud.solicitante_dni) {
          const title = `Solicitud ${meta.estado}: ${meta.solicitud.codigo}`;
          const isPagado = meta.estado === 'PAGADO';
          const msg = isPagado 
            ? `Tu solicitud fue abonada por el cajero ${meta.solicitud.pagado_por_nombre}`
            : `La solicitud fue ${meta.estado.toLowerCase()} por ${meta.solicitud.aprobado_por_nombre}`;
          showToast({ title, message: msg, type: meta.estado === 'APROBADO' || isPagado ? 'success' : 'danger' });
          fireNativeNotification(title, msg);
        }
      }
    });

    return () => unsubscribe();
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
    playNotificationSound('success');
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

  const handleUpdateEstado = async (id, estado, observaciones) => {
    return await store.updateEstadoSolicitud(id, estado, currentUser, observaciones);
  };

  const handleSaveUsuario = async (userData) => {
    return await store.saveUsuario(userData);
  };

  const handleToggleActivo = async (dni) => {
    return await store.toggleUsuarioActivo(dni);
  };

  const handleMarcarLeidas = () => {
    store.marcarNotificacionesLeidas();
  };

  const pendientesCount = solicitudes.filter(s => s.estado === 'PENDIENTE').length;

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
                onSubmitSolicitud={handleCreateSolicitud}
                onSuccessTab={() => setCurrentTab('mis_solicitudes')}
              />
            )}

            {currentTab === 'mis_solicitudes' && (
              <MisSolicitudes
                currentUser={currentUser}
                solicitudes={solicitudes}
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

            {currentTab === 'reportes' && (
              <ModuloReportes
                currentUser={currentUser}
                solicitudes={solicitudes}
                cajaFondo={cajaFondo}
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
