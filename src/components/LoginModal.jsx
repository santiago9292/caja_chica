import React, { useState } from 'react';
import { UserCheck, AlertCircle, ArrowRight, Sparkles, Building2 } from 'lucide-react';

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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      <div className="login-modal-panel" style={{
        display: 'flex',
        flexDirection: 'row',
        maxWidth: '900px',
        width: '100%',
        height: 'auto',
        maxHeight: '90vh',
        background: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Lado Izquierdo: Formulario */}
        <div className="login-left-panel" style={{
          flex: '1 1 50%',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }}>
              <Building2 size={32} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
              Caja Chica Corporativa
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Plataforma de gestión de gastos y aprobaciones
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#334155', fontWeight: '600' }}>Número de DNI</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>8 dígitos</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <UserCheck size={18} />
                </div>
                <input
                  type="text"
                  maxLength={12}
                  className="form-input"
                  placeholder="Ej: 10203040"
                  value={dniInput}
                  onChange={(e) => {
                    setDniInput(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  autoFocus
                  style={{
                    fontSize: '1.1rem',
                    letterSpacing: '0.06em',
                    padding: '0.85rem 1rem 0.85rem 2.75rem',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxShadow: 'none',
                    width: '100%'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" className="btn" style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: '600',
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <span>Ingresar al Sistema</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Lado Derecho: Accesos Rápidos */}
        <div className="login-right-panel" style={{
          flex: '1 1 50%',
          background: '#f8fafc',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '2rem 2rem 1rem',
            background: 'linear-gradient(to bottom, #f8fafc 80%, rgba(248,250,252,0) 100%)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#2563eb" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', margin: 0 }}>
                Acceso de Demostración
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', marginBottom: 0 }}>
              Selecciona un perfil para probar los diferentes roles.
            </p>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 2rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {usuarios.slice(0, 5).map((u) => (
              <div
                key={u.dni}
                onClick={() => handleQuickSelect(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>
                      {u.nombres}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                      {u.dni}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className={`badge ${
                          r === 'SYSADMIN' ? 'badge-sysadmin' :
                          r === 'ADMINISTRADOR' ? 'badge-admin' :
                          r === 'SOLICITANTE' ? 'badge-solicitante' : 'badge-usuario'
                        }`}
                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '6px' }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  flexShrink: 0
                }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .login-modal-panel {
            flex-direction: column !important;
            max-height: 95vh !important;
            height: 100% !important;
          }
          .login-left-panel {
            padding: 1.5rem !important;
            flex: none !important;
          }
          .login-right-panel {
            flex: 1 !important;
            border-left: none !important;
            border-top: 1px solid #e2e8f0;
          }
          .login-right-panel > div:last-child {
            padding-bottom: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
