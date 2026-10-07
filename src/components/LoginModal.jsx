import React, { useState } from 'react';
import { UserCheck, AlertCircle, ArrowRight, Building2, ShieldCheck } from 'lucide-react';

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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        animation: 'zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'center'
      }}>
        
        {/* Logo / Cabecera */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
        }}>
          <Building2 size={32} color="#ffffff" />
        </div>

        <h1 style={{
          fontSize: '1.65rem',
          color: '#0f172a',
          margin: '0 0 0.4rem 0',
          fontWeight: '800',
          fontFamily: "'Outfit', sans-serif"
        }}>
          Caja Chica Corporativa
        </h1>

        <p style={{
          color: '#64748b',
          fontSize: '0.9rem',
          margin: '0 0 2rem 0'
        }}>
          Ingresa tu número de DNI para acceder al sistema
        </p>

        {/* Formulario */}
        <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
          <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: '#334155', fontWeight: '600', fontSize: '0.85rem' }}>Número de DNI</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>8 dígitos</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}>
                <UserCheck size={18} />
              </div>
              <input
                type="text"
                maxLength={10}
                className="form-input"
                placeholder="Ej: 10203040"
                value={dniInput}
                onChange={(e) => {
                  setDniInput(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                autoFocus
                style={{
                  fontSize: '1.15rem',
                  letterSpacing: '0.08em',
                  padding: '0.85rem 1rem 0.85rem 2.85rem',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxShadow: 'none',
                  width: '100%',
                  fontWeight: '600'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
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
              marginBottom: '1.25rem',
              textAlign: 'left',
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              padding: '0.9rem',
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
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          color: '#94a3b8',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Acceso restringido para personal autorizado</span>
        </div>

      </div>
    </div>
  );
}
