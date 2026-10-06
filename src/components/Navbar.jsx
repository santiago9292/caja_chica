import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  FileSpreadsheet, 
  Users, 
  Wallet, 
  Download, 
  Radio, 
  Settings2,
  CheckSquare
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

  return (
    <>
      <header className="header-bar">
        {/* Marca y Estado */}
        <div className="brand-section">
          <div className="brand-logo">
            <Building2 size={22} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">
              <span>CajaChica</span>
              <span style={{ color: '#2563eb', fontSize: '0.8rem', fontWeight: '700' }}>CORP</span>
              <span className="pulse-indicator" title="Tiempo Real Activo" />
            </div>
            <div className="brand-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{isSupabaseConfigured ? 'Supabase Realtime' : 'Modo Sincronizado PWA'}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          
          {canInstallPwa && (
            <button 
              className="btn btn-secondary" 
              onClick={handleInstallClick} 
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
              title="Instalar App PWA"
            >
              <Download size={14} color="#0f172a" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Configuración */}
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={onOpenSettings} 
            title="Configuración de Base de Datos"
          >
            <Settings2 size={18} color="#475569" />
          </button>

          {/* Notificaciones */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              title="Notificaciones en vivo"
              style={{ position: 'relative' }}
            >
              <Bell size={18} color="#475569" />
              {unreadNotifs.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '16px',
                  height: '16px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '0.65rem',
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
                  top: '115%',
                  width: '320px',
                  maxWidth: '90vw',
                  padding: '1rem',
                  zIndex: 100,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>Notificaciones en Vivo</span>
                  {unreadNotifs.length > 0 && (
                    <button 
                      onClick={() => {
                        onMarcarLeidas();
                        setShowNotifMenu(false);
                      }}
                      className="btn btn-ghost" 
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }}
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {notificaciones.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      No hay notificaciones
                    </div>
                  ) : (
                    notificaciones.slice(0, 10).map(n => (
                      <div 
                        key={n.id} 
                        style={{
                          padding: '0.55rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: n.leido ? '#f8fafc' : '#eff6ff',
                          borderLeft: `3px solid ${n.tipo === 'SUCCESS' ? '#059669' : n.tipo === 'DANGER' ? '#dc2626' : '#2563eb'}`,
                          fontSize: '0.78rem'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.15rem' }}>{n.titulo}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>{n.mensaje}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
                          {new Date(n.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Perfil Usuario */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.35rem 0.75rem',
            background: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.1 }}>
                {currentUser?.nombres} {currentUser?.apellidos?.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                DNI: {currentUser?.dni}
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="btn btn-ghost btn-icon"
              style={{ width: '30px', height: '30px' }}
              title="Cerrar sesión"
            >
              <LogOut size={15} color="#dc2626" />
            </button>
          </div>

        </div>
      </header>

      {/* Roles Activos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Roles del usuario:</span>
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

      {/* Navegación por pestañas */}
      <nav className="nav-tabs-container">
        {isSolicitante && (
          <button 
            className={`nav-tab-btn ${currentTab === 'nuevo' ? 'active' : ''}`}
            onClick={() => setCurrentTab('nuevo')}
          >
            <PlusCircle size={16} />
            <span>Ingreso de Solicitud</span>
          </button>
        )}

        {isSolicitante && (
          <button 
            className={`nav-tab-btn ${currentTab === 'mis_solicitudes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('mis_solicitudes')}
          >
            <Clock size={16} />
            <span>Mis Solicitudes</span>
          </button>
        )}

        {isAdmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'aprobaciones' ? 'active' : ''}`}
            onClick={() => setCurrentTab('aprobaciones')}
          >
            <CheckSquare size={16} />
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
            <Wallet size={16} />
            <span>Arqueo & Balance</span>
          </button>
        )}

        {isSysadmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'maestro_dni' ? 'active' : ''}`}
            onClick={() => setCurrentTab('maestro_dni')}
          >
            <Users size={16} />
            <span>Maestro de DNIs & Roles</span>
          </button>
        )}

        {(isAdmin || isSysadmin || isUsuario) && (
          <button 
            className={`nav-tab-btn ${currentTab === 'reportes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('reportes')}
          >
            <FileSpreadsheet size={16} />
            <span>Reportes & Excel</span>
          </button>
        )}
      </nav>
    </>
  );
}
