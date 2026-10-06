import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Globe, 
  CheckCircle2, 
  X, 
  Bell, 
  Radio
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
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="#0f172a" />
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
              Configuración de Supabase & PWA
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Estado */}
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: isSupabaseConfigured ? 'var(--success-bg)' : '#f8fafc',
          border: `1px solid ${isSupabaseConfigured ? 'var(--success-border)' : '#e2e8f0'}`,
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isSupabaseConfigured ? '#059669' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>
              {isSupabaseConfigured ? 'Conectado a Supabase Realtime' : 'Modo Reactivo Local / PWA'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isSupabaseConfigured 
                ? 'Suscripción activa a postgres_changes.' 
                : 'Sincronización multi-pestaña activa.'}
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={18} color="#475569" />
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.825rem', color: '#0f172a' }}>
                Notificaciones del Navegador
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Estado: {notifPermission === 'granted' ? 'Habilitadas' : notifPermission === 'denied' ? 'Bloqueadas' : 'Pendiente'}
              </div>
            </div>
          </div>

          {notifPermission !== 'granted' && (
            <button onClick={handleRequestNotif} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
              Permitir
            </button>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSaveConfig}>
          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon Public Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGci..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>

          {savedSuccess && (
            <div style={{ color: '#059669', fontSize: '0.8rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={15} />
              <span>Guardado. Recargando...</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
            <button
              type="button"
              onClick={handleClearConfig}
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', color: '#dc2626' }}
            >
              Restablecer
            </button>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cerrar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
