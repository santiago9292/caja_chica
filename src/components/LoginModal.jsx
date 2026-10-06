import React, { useState } from 'react';
import { UserCheck, Shield, KeyRound, AlertCircle, ArrowRight, Sparkles, Building2 } from 'lucide-react';

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
      setErrorMsg(`El DNI ${dni} no está registrado en el Maestro de Personal.`);
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
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.35)' }}>
      <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Encabezado del Login */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-md)',
            background: '#0f172a',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Building2 size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '0.3rem' }}>
            Caja Chica Corporativa
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Acceso seguro por DNI con perfiles multi-rol
          </p>
        </div>

        {/* Formulario de Login directo con DNI */}
        <form onSubmit={handleLoginSubmit} style={{ marginBottom: '1.75rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Número de DNI / Documento</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>8 dígitos</span>
            </label>
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
              style={{ fontSize: '1.1rem', letterSpacing: '0.06em', padding: '0.75rem 1rem' }}
            />
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-text)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}>
            <span>Ingresar al Sistema</span>
            <ArrowRight size={17} />
          </button>
        </form>

        {/* Selector Rápido de Perfiles de Prueba */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Sparkles size={15} color="#2563eb" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Acceso Rápido de Demostración
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {usuarios.slice(0, 5).map((u) => (
              <div
                key={u.dni}
                onClick={() => handleQuickSelect(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>
                      {u.nombres} {u.apellidos}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                      ({u.dni})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className={`badge ${
                          r === 'SYSADMIN' ? 'badge-sysadmin' :
                          r === 'ADMINISTRADOR' ? 'badge-admin' :
                          r === 'SOLICITANTE' ? 'badge-solicitante' : 'badge-usuario'
                        }`}
                        style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
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
