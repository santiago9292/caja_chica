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
  Check,
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

  // Escuchar evento de instalación PWA
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

  // Determinar roles del usuario activo
  const userRoles = currentUser?.roles || [];
  const isSysadmin = userRoles.includes('SYSADMIN');
  const isAdmin = userRoles.includes('ADMINISTRADOR');
  const isSolicitante = userRoles.includes('SOLICITANTE');
  const isUsuario = userRoles.includes('USUARIO');

  const unreadNotifs = notificaciones.filter(n => !n.leido);

  return (
    <>
      <header className="header-bar">
        {/* Marca y Estado Realtime */}
        <div className="brand-section">
          <div className="brand-logo">
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <div className="brand-title">
              <span>CajaChica</span>
              <span style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: '600' }}>PRO</span>
              <span className="pulse-indicator" title="Tiempo Real Activo" />
            </div>
            <div className="brand-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Radio size={12} color="#10b981" />
              <span>{isSupabaseConfigured ? 'Supabase Realtime' : 'Sincronización Local / PWA'}</span>
            </div>
          </div>
        </div>

        {/* Acciones del usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Botón Instalar PWA si está disponible */}
          {canInstallPwa && (
            <button 
              className="btn btn-secondary" 
              onClick={handleInstallClick} 
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              title="Instalar App en el dispositivo"
            >
              <Download size={15} color="var(--primary-light)" />
              <span className="desktop-only">Instalar App</span>
            </button>
          )}

          {/* Botón Configuración / Conexión Supabase */}
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={onOpenSettings} 
            title="Configuración de Base de Datos y Supabase"
          >
            <Settings2 size={19} />
          </button>

          {/* Botón y Popover de Notificaciones en Vivo */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              title="Notificaciones en vivo"
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              {unreadNotifs.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '18px',
                  height: '18px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }}>
                  {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Menu Desplegable de Notificaciones */}
            {showNotifMenu && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '120%',
                  width: '320px',
                  maxWidth: '90vw',
                  padding: '1rem',
                  zIndex: 100,
                  border: '1px solid var(--border-glass)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Notificaciones en Vivo</span>
                  {unreadNotifs.length > 0 && (
                    <button 
                      onClick={() => {
                        onMarcarLeidas();
                        setShowNotifMenu(false);
                      }}
                      className="btn btn-ghost" 
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notificaciones.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      No hay notificaciones recientes
                    </div>
                  ) : (
                    notificaciones.slice(0, 10).map(n => (
                      <div 
                        key={n.id} 
                        style={{
                          padding: '0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: n.leido ? 'rgba(255,255,255,0.02)' : 'rgba(2, 132, 199, 0.1)',
                          borderLeft: `3px solid ${n.tipo === 'SUCCESS' ? '#10b981' : n.tipo === 'DANGER' ? '#ef4444' : '#0ea5e9'}`,
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#fff', marginBottom: '0.2rem' }}>{n.titulo}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{n.mensaje}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginTop: '0.3rem' }}>
                          {new Date(n.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta del Perfil de Usuario Actual */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', lineHeight: 1.1 }}>
                {currentUser?.nombres} {currentUser?.apellidos?.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                DNI: {currentUser?.dni}
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="btn btn-ghost btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="Cerrar sesión"
            >
              <LogOut size={16} color="#f87171" />
            </button>
          </div>

        </div>
      </header>

      {/* Roles Activos del Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Tus Roles Activos:</span>
        {userRoles.map((r) => (
          <span 
            key={r} 
            className={`badge ${
              r === 'SYSADMIN' ? 'badge-sysadmin' :
              r === 'ADMINISTRADOR' ? 'badge-admin' :
              r === 'SOLICITANTE' ? 'badge-solicitante' : 'badge-usuario'
            }`}
          >
            {r === 'SYSADMIN' && <ShieldCheck size={12} />}
            {r === 'ADMINISTRADOR' && <CheckSquare size={12} />}
            {r}
          </span>
        ))}
      </div>

      {/* Pestañas de Navegación según Roles */}
      <nav className="nav-tabs-container">
        {/* Pestaña: Nueva Solicitud (SOLICITANTE o SYSADMIN/ADMIN con rol de solicitante) */}
        {isSolicitante && (
          <button 
            className={`nav-tab-btn ${currentTab === 'nuevo' ? 'active' : ''}`}
            onClick={() => setCurrentTab('nuevo')}
          >
            <PlusCircle size={18} />
            <span>Ingreso de Solicitud / Rendición</span>
          </button>
        )}

        {/* Pestaña: Mis Solicitudes (SOLICITANTE) */}
        {isSolicitante && (
          <button 
            className={`nav-tab-btn ${currentTab === 'mis_solicitudes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('mis_solicitudes')}
          >
            <Clock size={18} />
            <span>Mis Solicitudes</span>
          </button>
        )}

        {/* Pestaña: Aprobaciones (SOLO ADMINISTRADOR) */}
        {isAdmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'aprobaciones' ? 'active' : ''}`}
            onClick={() => setCurrentTab('aprobaciones')}
            style={{ position: 'relative' }}
          >
            <CheckSquare size={18} />
            <span>Módulo de Aprobación</span>
            {pendientesCount > 0 && (
              <span className="tab-badge" style={{ background: '#f59e0b', color: '#000', fontWeight: '800' }}>
                {pendientesCount}
              </span>
            )}
          </button>
        )}

        {/* Pestaña: Arqueo y Movimientos Generales (ADMINISTRADOR o USUARIO) */}
        {(isAdmin || isUsuario || isSysadmin) && (
          <button 
            className={`nav-tab-btn ${currentTab === 'arqueo' ? 'active' : ''}`}
            onClick={() => setCurrentTab('arqueo')}
          >
            <Wallet size={18} />
            <span>Arqueo & Balance</span>
          </button>
        )}

        {/* Pestaña: Maestro de DNIs y Asignación de Roles (SOLO SYSADMIN) */}
        {isSysadmin && (
          <button 
            className={`nav-tab-btn ${currentTab === 'maestro_dni' ? 'active' : ''}`}
            onClick={() => setCurrentTab('maestro_dni')}
          >
            <Users size={18} />
            <span>Maestro de DNIs & Roles</span>
          </button>
        )}

        {/* Pestaña: Reportes y Exportar a Excel (ADMINISTRADOR, SYSADMIN o USUARIO) */}
        {(isAdmin || isSysadmin || isUsuario) && (
          <button 
            className={`nav-tab-btn ${currentTab === 'reportes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('reportes')}
          >
            <FileSpreadsheet size={18} />
            <span>Reportes & Excel</span>
          </button>
        )}
      </nav>
    </>
  );
}
