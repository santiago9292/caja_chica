import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Bell, 
  RefreshCw, 
  Radio, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/store';

export function SupabaseConfigModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('caja_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('caja_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [notifPermission, setNotifPermission] = useState('default');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotif = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('caja_supabase_url', supabaseUrl.trim());
    localStorage.setItem('caja_supabase_key', supabaseKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleClearConfig = () => {
    localStorage.removeItem('caja_supabase_url');
    localStorage.removeItem('caja_supabase_key');
    window.location.reload();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Database size={24} color="#38bdf8" />
            <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>
              Configuración de Supabase & PWA
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Estado Actual */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)',
          border: `1px solid ${isSupabaseConfigured ? 'var(--success-border)' : 'var(--border-glass)'}`,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isSupabaseConfigured ? '#10b981' : '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
              {isSupabaseConfigured ? 'Conectado a Supabase Realtime' : 'Modo Reactivo Local / PWA Offline Activo'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isSupabaseConfigured 
                ? 'Suscripción activa a postgres_changes para solicitudes y notificaciones.'
                : 'Sincronización multi-pestaña inmediata activa mediante BroadcastChannel y LocalStorage.'}
            </div>
          </div>
        </div>

        {/* Notificaciones del Sistema Operativo / PWA */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={20} color="var(--primary-light)" />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#fff' }}>
                Notificaciones Nativas del Navegador
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Estado: {notifPermission === 'granted' ? '✅ Permitidas' : notifPermission === 'denied' ? '❌ Bloqueadas' : '⏳ Pendiente de permiso'}
              </div>
            </div>
          </div>

          {notifPermission !== 'granted' && (
            <button onClick={handleRequestNotif} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              Permitir
            </button>
          )}
        </div>

        {/* Formulario de Parámetros Supabase */}
        <form onSubmit={handleSaveConfig}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={15} color="var(--primary-light)" />
              <span>Project URL de Supabase</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={15} color="var(--primary-light)" />
              <span>Anon Public Key de Supabase</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>

          {savedSuccess && (
            <div style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>Configuración guardada. Recargando conexión...</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={handleClearConfig}
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', color: '#ef4444' }}
            >
              Restablecer Modo Local
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cerrar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar y Conectar
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
