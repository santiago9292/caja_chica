import React, { useState } from 'react';
import { 
  Send, 
  Receipt, 
  Banknote, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X
} from 'lucide-react';
import { playNotificationSound } from '../lib/audioNotifier';

const CATEGORIAS = [
  { id: 'TRANSPORTE', label: 'Transporte / Movilidad' },
  { id: 'ALIMENTACION', label: 'Alimentación / Refrigerios' },
  { id: 'MATERIALES_OFICINA', label: 'Materiales de Oficina' },
  { id: 'SERVICIOS_URGENTES', label: 'Servicios Urgentes' },
  { id: 'REPRESENTACION', label: 'Gastos de Representación' },
  { id: 'OTROS', label: 'Otros Gastos Operativos' }
];

const TIPOS_COMPROBANTE = [
  { id: 'FACTURA', label: 'Factura Electrónica' },
  { id: 'BOLETA', label: 'Boleta de Venta' },
  { id: 'RECIBO_HONORARIOS', label: 'Recibo por Honorarios' },
  { id: 'TICKET_VALE', label: 'Ticket / Vale Autorizado' },
  { id: 'DECLARACION_JURADA', label: 'Declaración Jurada de Gasto' },
  { id: 'SIN_COMPROBANTE', label: 'Sin Comprobante Físico' }
];

export function FormularioIngreso({ currentUser, onSubmitSolicitud, onSuccessTab }) {
  const [tipo, setTipo] = useState('RENDICION_GASTO');
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [categoria, setCategoria] = useState('TRANSPORTE');
  
  // Datos del comprobante
  const [comprobanteTipo, setComprobanteTipo] = useState('FACTURA');
  const [comprobanteNumero, setComprobanteNumero] = useState('');
  const [comprobanteRuc, setComprobanteRuc] = useState('');
  const [comprobanteRazonSocial, setComprobanteRazonSocial] = useState('');
  const [comprobanteFecha, setComprobanteFecha] = useState(new Date().toISOString().slice(0, 10));
  const [comprobanteArchivo, setComprobanteArchivo] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('El archivo no debe superar los 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setComprobanteArchivo(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('Por favor ingrese un monto válido mayor a 0.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('Por favor especifique el concepto o justificación del gasto.');
      return;
    }

    if (tipo === 'RENDICION_GASTO' && comprobanteTipo === 'FACTURA') {
      if (!comprobanteRuc.trim() || comprobanteRuc.length < 11) {
        setErrorMsg('Para facturas se requiere un RUC válido de 11 dígitos.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = {
        tipo,
        solicitante_dni: currentUser.dni,
        solicitante_nombre: `${currentUser.nombres} ${currentUser.apellidos}`,
        monto: montoNum,
        motivo: motivo.trim(),
        categoria,
        comprobante_tipo: tipo === 'RENDICION_GASTO' ? comprobanteTipo : null,
        comprobante_numero: tipo === 'RENDICION_GASTO' ? comprobanteNumero.trim() : null,
        comprobante_ruc_emisor: tipo === 'RENDICION_GASTO' ? comprobanteRuc.trim() : null,
        comprobante_razon_social: tipo === 'RENDICION_GASTO' ? comprobanteRazonSocial.trim() : null,
        comprobante_fecha: tipo === 'RENDICION_GASTO' ? comprobanteFecha : null,
        comprobante_archivo_url: comprobanteArchivo || null
      };

      const result = await onSubmitSolicitud(data);
      playNotificationSound('alert');
      setSuccessCode(result.codigo);
      
      setMonto('');
      setMotivo('');
      setComprobanteNumero('');
      setComprobanteRuc('');
      setComprobanteRazonSocial('');
      setComprobanteArchivo('');
    } catch (err) {
      setErrorMsg('Error al registrar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
      
      {/* Notificación de Éxito */}
      {successCode && (
        <div className="glass-panel" style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--success-text)', fontSize: '0.9rem' }}>
                Solicitud registrada con éxito
              </div>
              <div style={{ color: '#047857', fontSize: '0.78rem' }}>
                Código generado: <strong>{successCode}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', flex: '1' }}
              onClick={() => setSuccessCode('')}
            >
              Registrar Otra
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', flex: '1' }}
              onClick={onSuccessTab}
            >
              Ver Solicitudes
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        
        {/* Cabecera */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.2rem' }}>
            Nueva Solicitud de Caja Chica
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Solicitante: <strong>{currentUser?.nombres} {currentUser?.apellidos}</strong> (DNI: {currentUser?.dni})
          </p>
        </div>

        {/* Selector de Tipo Responsive (Wrap) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            onClick={() => setTipo('RENDICION_GASTO')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${tipo === 'RENDICION_GASTO' ? '#0f172a' : 'var(--border-subtle)'}`,
              background: tipo === 'RENDICION_GASTO' ? '#f8fafc' : '#ffffff',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: tipo === 'RENDICION_GASTO' ? '#0f172a' : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Receipt size={18} color={tipo === 'RENDICION_GASTO' ? '#fff' : '#475569'} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                Rendición de Gasto
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Con factura o comprobante
              </div>
            </div>
          </div>

          <div
            onClick={() => setTipo('ADELANTO_DINERO')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${tipo === 'ADELANTO_DINERO' ? '#0f172a' : 'var(--border-subtle)'}`,
              background: tipo === 'ADELANTO_DINERO' ? '#f8fafc' : '#ffffff',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: tipo === 'ADELANTO_DINERO' ? '#0f172a' : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Banknote size={18} color={tipo === 'ADELANTO_DINERO' ? '#fff' : '#475569'} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                Adelanto de Efectivo
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Requerimiento previo
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">
                Monto (S/) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#475569' }}>
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontWeight: '700' }}
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Categoría del Gasto *</label>
              <select
                className="form-select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Concepto o Justificación *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describa el motivo del gasto o compra..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          {/* Datos de Comprobante */}
          {tipo === 'RENDICION_GASTO' && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.15rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <Receipt size={16} color="#0f172a" />
                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                  Datos del Comprobante
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={comprobanteTipo}
                    onChange={(e) => setComprobanteTipo(e.target.value)}
                  >
                    {TIPOS_COMPROBANTE.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Serie y Número</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: F001-0012847"
                    value={comprobanteNumero}
                    onChange={(e) => setComprobanteNumero(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={comprobanteFecha}
                    onChange={(e) => setComprobanteFecha(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">RUC Proveedor</label>
                  <input
                    type="text"
                    maxLength={11}
                    className="form-input"
                    placeholder="11 dígitos"
                    value={comprobanteRuc}
                    onChange={(e) => setComprobanteRuc(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Razón Social</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre o empresa"
                    value={comprobanteRazonSocial}
                    onChange={(e) => setComprobanteRazonSocial(e.target.value)}
                  />
                </div>
              </div>

              {/* Adjuntar Archivo */}
              <div style={{ marginTop: '0.85rem' }}>
                <label className="form-label">Foto del Voucher / Comprobante</label>
                
                {!comprobanteArchivo ? (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    border: '2px dashed #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: '#ffffff',
                    transition: 'var(--transition)'
                  }}>
                    <Upload size={20} color="#64748b" style={{ marginBottom: '0.25rem' }} />
                    <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: '600' }}>
                      Tomar foto o seleccionar archivo
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                      PNG, JPG hasta 8MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    maxHeight: '180px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}>
                    <img
                      src={comprobanteArchivo}
                      alt="Comprobante"
                      style={{ width: '100%', height: '180px', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setComprobanteArchivo('')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Quitar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.85rem',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-text)',
              fontSize: '0.8rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', maxWidth: '240px' }}
            >
              <Send size={15} />
              <span>{submitting ? 'Enviando...' : 'Registrar Solicitud'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
