import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  Bell, 
  Radio
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/store';

export function SupabaseConfigModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [notifPermission, setNotifPermission] = useState('default');

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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="#0f172a" />
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
              Estado del Sistema en tiempo real
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
              {isSupabaseConfigured ? 'Conectado a Supabase Realtime' : 'Modo sincronizado en tiempo real'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isSupabaseConfigured 
                ? 'Suscripción activa a eventos en vivo en la nube.' 
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

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <button type="button" onClick={onClose} className="btn btn-primary">
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
}

