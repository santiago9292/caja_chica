import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  LogOut, 
  PlusCircle, 
  FileSpreadsheet, 
  Users, 
  Wallet, 
  Download, 
  Settings2,
  CheckSquare,
  Clock,
  User,
  Tag
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/store';

export function Navbar({ 
  currentUser, 
  onLogout, 
  currentTab, 
  setCurrentTab, 
  pendientesCount = 0,
  notificaciones = [],
  onMarcarLeidas,
  onOpenSettings
}) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Validación de si la aplicación ya está instalada en el dispositivo
  const checkIfInstalled = () => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true ||
                         (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
    return Boolean(isStandalone || localStorage.getItem('pwa_installed') === 'true');
  };

  const [isInstalled, setIsInstalled] = useState(checkIfInstalled);

  useEffect(() => {
    const checkState = () => {
      if (checkIfInstalled()) {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
    };
    checkState();

    const mediaQuery = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
    };
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        alert("Para instalar en tu iPhone o iPad:\n1. Toca el botón 'Compartir' (icono con flecha hacia arriba) en Safari.\n2. Elige 'Agregar a pantalla de inicio'.");
      } else {
        alert("Para instalar esta aplicación:\n1. Toca el menú de tu navegador (⋮ en la esquina superior derecha).\n2. Elige 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
      }
    }
  };

  const userRoles = currentUser?.roles || [];
  const isSysadmin = userRoles.includes('SYSADMIN');
  const isAdmin = userRoles.includes('ADMINISTRADOR');
  const isSolicitante = userRoles.includes('SOLICITANTE');
  const isUsuario = userRoles.includes('USUARIO');

  const unreadNotifs = notificaciones.filter(n => !n.leido);
  
  // Iniciales del usuario para el avatar
  const getInitials = () => {
    if (!currentUser) return 'U';
    const n = currentUser.nombres ? currentUser.nombres[0] : '';
    const a = currentUser.apellidos ? currentUser.apellidos[0] : '';
    return (n + a).toUpperCase() || 'U';
  };

  return (
    <>
      <header className="header-bar">
        {/* Marca a la izquierda */}
        <div className="brand-section" style={{ minWidth: 0, flexShrink: 1, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img 
            src="/logo-dicar.png" 
            alt="DICAR LOGISTIC" 
            style={{ 
              height: '34px', 
              width: 'auto', 
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="brand-title" style={{ flexWrap: 'nowrap', gap: '0.35rem', overflow: 'hidden', alignItems: 'center' }}>
              <span className={!isInstalled ? "desktop-only" : ""} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '800', letterSpacing: '-0.01em' }}>
                CAJA CHICA
              </span>
              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  title="Instalar CAJA CHICA en tu dispositivo"
                >
                  <Download size={13} strokeWidth={2.5} />
                  <span>Instalar</span>
                </button>
              )}
              <span className="pulse-indicator" title="En tiempo real" style={{ flexShrink: 0 }} />
            </div>
            <div className="brand-subtitle" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
              <span className="desktop-only">En tiempo real</span>
              <span className="desktop-only" style={{ opacity: 0.5 }}>•</span>
              <span style={{ fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', letterSpacing: '0.5px' }}>v6.0</span>
            </div>
          </div>
        </div>

        {/* Acciones a la derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>

          {/* Configuración */}
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={onOpenSettings} 
            title="Configuración de Base de Datos"
          >
            <Settings2 size={17} color="#475569" />
          </button>

          {/* Notificaciones */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              title="Notificaciones en vivo"
              style={{ position: 'relative' }}
            >
              <Bell size={17} color="#475569" />
              {unreadNotifs.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '15px',
                  height: '15px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Menu Popover */}
            {showNotifMenu && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '125%',
                  width: '290px',
                  maxWidth: '85vw',
                  padding: '0.85rem',
                  zIndex: 100,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.825rem', color: '#0f172a' }}>Notificaciones</span>
                  {unreadNotifs.length > 0 && (
                    <button 
                      onClick={() => {
                        onMarcarLeidas();
                        setShowNotifMenu(false);
                      }}
                      className="btn btn-ghost" 
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem' }}
                    >
                      Leídas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                    <div style={{
                      padding: '0.45rem 0.6rem',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      marginBottom: '0.4rem',
                      fontSize: '0.72rem',
                      color: '#1e40af',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem'
                    }}>
                      <div style={{ fontWeight: '700' }}>🔔 Alertas de escritorio PC:</div>
                      <div>
                        {Notification.permission === 'denied' 
                          ? 'Están bloqueadas en esta PWA. Haz clic en el icono 🔕 de la barra superior para permitirlas.' 
                          : 'Activa las alertas para enterarte de inmediato al recibir adelantos.'}
                      </div>
                      {Notification.permission === 'default' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await Notification.requestPermission();
                          }}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: '700',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Habilitar Alertas
                        </button>
                      )}
                    </div>
                  )}
                  {notificaciones.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '1rem 0' }}>
                      Sin notificaciones
                    </div>
                  ) : (
                    notificaciones.slice(0, 8).map(n => (
                      <div 
                        key={n.id} 
                        style={{
                          padding: '0.45rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: n.leido ? '#f8fafc' : '#eff6ff',
                          borderLeft: `3px solid ${n.tipo === 'SUCCESS' ? '#059669' : n.tipo === 'DANGER' ? '#dc2626' : '#2563eb'}`,
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.1rem' }}>{n.titulo}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{n.mensaje}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta Usuario Limpia y Anti-Desbordamiento */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.2rem',
            background: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Avatar con Iniciales */}
            <div 
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: '700',
                flexShrink: 0
              }}
              title={`${currentUser?.nombres} ${currentUser?.apellidos} (DNI: ${currentUser?.dni})`}
            >
              {getInitials()}
            </div>

            {/* Nombre Completo solo en pantallas medianas/grandes */}
            <div className="desktop-only" style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.nombres?.split(' ')[0]} {currentUser?.apellidos?.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {currentUser?.dni}
              </div>
            </div>

            {/* Botón Salir */}
            <button 
              onClick={onLogout}
              className="btn btn-ghost btn-icon"
              style={{ width: '26px', height: '26px', minWidth: '26px' }}
              title="Cerrar sesión"
            >
              <LogOut size={14} color="#dc2626" />
            </button>
          </div>

        </div>
      </header>

      {/* Badges de Roles del Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>Roles del usuario:</span>
        {userRoles.map((r) => (
          <span 
            key={r} 
            className={`badge ${
              r === 'SYSADMIN' ? 'badge-sysadmin' :
              r === 'ADMINISTRADOR' ? 'badge-admin' :
              r === 'SOLICITANTE' ? 'badge-solicitante' : 'badge-usuario'
            }`}
          >
            {r}
          </span>
        ))}
      </div>

      {/* Pestañas de Navegación con Scroll Horizontal Suave */}
      <nav className="nav-tabs-container">
        {isSolicitante && (
          <button 
            className={`nav-tab-btn ${currentTab === 'nuevo' ? 'active' : ''}`}
            onClick={() => setCurrentTab('nuevo')}
          >
            <PlusCircle size={15} />
            <span>Ingreso Solicitud</span>
          </button>
        )}

        {isSolicitante && (
          <button 
            className={`nav-tab-btn ${currentTab === 'mis_solicitudes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('mis_solicitudes')}
          >
            <Clock size={15} />
            <span>Mis Solicitudes</span>
          </button>
        )}

        {isAdmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'aprobaciones' ? 'active' : ''}`}
            onClick={() => setCurrentTab('aprobaciones')}
          >
            <CheckSquare size={15} />
            <span>Módulo de Aprobación</span>
            {pendientesCount > 0 && (
              <span className="tab-badge">
                {pendientesCount}
              </span>
            )}
          </button>
        )}

        {(isAdmin || isUsuario || isSysadmin) && (
          <button 
            className={`nav-tab-btn ${currentTab === 'arqueo' ? 'active' : ''}`}
            onClick={() => setCurrentTab('arqueo')}
          >
            <Wallet size={15} />
            <span>Arqueo & Balance</span>
          </button>
        )}

        {isSysadmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'maestro_dni' ? 'active' : ''}`}
            onClick={() => setCurrentTab('maestro_dni')}
          >
            <Users size={15} />
            <span>Maestro DNIs</span>
          </button>
        )}

        {isSysadmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'maestro_categorias' ? 'active' : ''}`}
            onClick={() => setCurrentTab('maestro_categorias')}
          >
            <Tag size={15} />
            <span>Categorías</span>
          </button>
        )}

        {(isAdmin || isSysadmin || isUsuario) && (
          <button 
            className={`nav-tab-btn ${currentTab === 'reportes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('reportes')}
          >
            <FileSpreadsheet size={15} />
            <span>Reportes Excel</span>
          </button>
        )}
      </nav>
    </>
  );
}
