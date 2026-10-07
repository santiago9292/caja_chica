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
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPwa(false);
    }
    setDeferredPrompt(null);
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
        <div className="brand-section" style={{ minWidth: 0, flexShrink: 1 }}>
          <div className="brand-logo" style={{ flexShrink: 0 }}>
            <Building2 size={18} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="brand-title" style={{ flexWrap: 'nowrap', gap: '0.3rem', overflow: 'hidden' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>CajaChica</span>
              <span style={{ color: '#2563eb', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>CORP</span>
              <span className="pulse-indicator" title="Tiempo Real Activo" style={{ flexShrink: 0 }} />
            </div>
            <div className="brand-subtitle desktop-only" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span>{isSupabaseConfigured ? 'Supabase Realtime' : 'Modo Sincronizado'}</span>
            </div>
          </div>
        </div>

        {/* Acciones a la derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
          
          {canInstallPwa && (
            <button 
              className="btn btn-secondary desktop-only" 
              onClick={handleInstallClick} 
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              title="Instalar App PWA"
            >
              <Download size={14} color="#0f172a" />
              <span>Instalar</span>
            </button>
          )}

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
