import React, { useState } from 'react';
import { UserCheck, Shield, KeyRound, AlertCircle, ArrowRight, Sparkles, Building2, UserPlus } from 'lucide-react';
import { DEFAULT_USUARIOS } from '../lib/store';

export function LoginModal({ onLogin, usuarios }) {
  const [dniInput, setDniInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const dni = dniInput.trim();
    if (!dni) {
      setErrorMsg('Por favor ingrese su número de DNI.');
      return;
    }

    const user = usuarios.find((u) => u.dni === dni);
    if (!user) {
      setErrorMsg(`El DNI ${dni} no está registrado en el Maestro de Personal. Contacte al SYSADMIN o use uno de los perfiles rápidos de prueba.`);
      return;
    }

    if (!user.activo) {
      setErrorMsg(`El usuario con DNI ${dni} se encuentra inactivo en el sistema.`);
      return;
    }

    setErrorMsg('');
    onLogin(user);
  };

  const handleQuickSelect = (user) => {
    setDniInput(user.dni);
    setErrorMsg('');
    onLogin(user);
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(5, 8, 18, 0.92)' }}>
      <div className="glass-panel" style={{ maxWidth: '580px', width: '100%', padding: '2.5rem', border: '1px solid var(--border-glass)' }}>
        
        {/* Encabezado del Login */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45)',
            marginBottom: '1rem'
          }}>
            <Building2 size={34} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '0.4rem' }}>
            Caja Chica Corporativa
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Acceso unificado por DNI y Roles Multi-nivel en tiempo real
          </p>
        </div>

        {/* Formulario de Login directo con DNI */}
        <form onSubmit={handleLoginSubmit} style={{ marginBottom: '1.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Número de DNI / Documento de Identidad</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>8 dígitos</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                maxLength={12}
                className="form-input"
                placeholder="Ingrese su DNI (ej: 10203040)"
                value={dniInput}
                onChange={(e) => {
                  setDniInput(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                autoFocus
                style={{ fontSize: '1.1rem', letterSpacing: '0.08em', paddingLeft: '1rem' }}
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}>
            <span>Ingresar al Sistema</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Selector Rápido de Perfiles de Prueba */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Sparkles size={16} color="var(--primary-light)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Acceso Rápido de Prueba (Demo de Roles)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {usuarios.slice(0, 5).map((u) => (
              <div
                key={u.dni}
                onClick={() => handleQuickSelect(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff' }}>
                      {u.nombres} {u.apellidos}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                      ({u.dni})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className={`badge ${
                          r === 'SYSADMIN'
                            ? 'badge-sysadmin'
                            : r === 'ADMINISTRADOR'
                            ? 'badge-admin'
                            : r === 'SOLICITANTE'
                            ? 'badge-solicitante'
                            : 'badge-usuario'
                        }`}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                >
                  Entrar
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
