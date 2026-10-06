import React, { useState } from 'react';
import { 
  Send, 
  Receipt, 
  Banknote, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Car, 
  Utensils, 
  Paperclip, 
  Wrench, 
  Briefcase, 
  HelpCircle,
  X,
  Camera
} from 'lucide-react';
import { playNotificationSound } from '../lib/audioNotifier';

const CATEGORIAS = [
  { id: 'TRANSPORTE', label: 'Transporte / Movilidad', icon: Car, color: '#38bdf8' },
  { id: 'ALIMENTACION', label: 'Alimentación / Refrigerios', icon: Utensils, color: '#f59e0b' },
  { id: 'MATERIALES_OFICINA', label: 'Materiales de Oficina', icon: FileText, color: '#10b981' },
  { id: 'SERVICIOS_URGENTES', label: 'Servicios Urgentes', icon: Wrench, color: '#ec4899' },
  { id: 'REPRESENTACION', label: 'Gastos de Representación', icon: Briefcase, color: '#a855f7' },
  { id: 'OTROS', label: 'Otros Gastos Operativos', icon: HelpCircle, color: '#94a3b8' }
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
  const [tipo, setTipo] = useState('RENDICION_GASTO'); // 'RENDICION_GASTO' | 'ADELANTO_DINERO'
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

  // Manejo de carga de imagen
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
        setErrorMsg('Para facturas se requiere un RUC de 11 dígitos.');
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
      
      // Limpiar formulario
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
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Notificación de Éxito al Registrar */}
      {successCode && (
        <div className="glass-panel" style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid var(--success-border)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '1.1rem' }}>
                ¡Solicitud Registrada con Éxito!
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Código generado: <strong style={{ color: '#34d399' }}>{successCode}</strong>. Notificación enviada al Administrador en tiempo real.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.85rem' }}
              onClick={() => setSuccessCode('')}
            >
              Registrar Otra
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ fontSize: '0.85rem' }}
              onClick={onSuccessTab}
            >
              Ver Mis Solicitudes
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        
        {/* Cabecera del Formulario */}
        <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.35rem' }}>
            Registro de Solicitud de Caja Chica
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Solicitante activo: <strong style={{ color: '#38bdf8' }}>{currentUser?.nombres} {currentUser?.apellidos}</strong> (DNI: {currentUser?.dni})
          </p>
        </div>

        {/* Selector de Tipo: Rendición vs Adelanto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
          <div
            onClick={() => setTipo('RENDICION_GASTO')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${tipo === 'RENDICION_GASTO' ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
              background: tipo === 'RENDICION_GASTO' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: tipo === 'RENDICION_GASTO' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={22} color={tipo === 'RENDICION_GASTO' ? '#fff' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                Rendición de Gasto
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ya pagué y cuento con comprobante (Factura, Boleta, etc.)
              </div>
            </div>
          </div>

          <div
            onClick={() => setTipo('ADELANTO_DINERO')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${tipo === 'ADELANTO_DINERO' ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
              background: tipo === 'ADELANTO_DINERO' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: tipo === 'ADELANTO_DINERO' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Banknote size={22} color={tipo === 'ADELANTO_DINERO' ? '#fff' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                Adelanto de Efectivo
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Requiero dinero para realizar una gestión o compra urgente
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Monto y Categoría */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                Monto Requerido (S/ Nuevos Soles) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary-light)' }}>
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontSize: '1.25rem', fontWeight: '700' }}
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
                style={{ height: '48px' }}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Motivo / Concepto */}
          <div className="form-group">
            <label className="form-label">Concepto / Motivo Detallado de la Operación *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describa claramente la finalidad del gasto, personas involucradas, destino o justificación corporativa..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          {/* Sección de Datos de Comprobante (Si es Rendición) */}
          {tipo === 'RENDICION_GASTO' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Receipt size={18} color="var(--primary-light)" />
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                  Datos del Comprobante de Pago
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de Comprobante</label>
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
                  <label className="form-label">Fecha del Comprobante</label>
                  <input
                    type="date"
                    className="form-input"
                    value={comprobanteFecha}
                    onChange={(e) => setComprobanteFecha(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">RUC del Proveedor</label>
                  <input
                    type="text"
                    maxLength={11}
                    className="form-input"
                    placeholder="Ej: 20100055231"
                    value={comprobanteRuc}
                    onChange={(e) => setComprobanteRuc(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Razón Social del Proveedor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: DISTRIBUIDORA LIMA S.A.C."
                    value={comprobanteRazonSocial}
                    onChange={(e) => setComprobanteRazonSocial(e.target.value)}
                  />
                </div>
              </div>

              {/* Subir Comprobante / Foto / Voucher */}
              <div style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Adjuntar Imagen o Foto del Comprobante / Voucher</label>
                
                {!comprobanteArchivo ? (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    border: '2px dashed var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'rgba(2, 132, 199, 0.05)',
                    transition: 'var(--transition)'
                  }}>
                    <Upload size={28} color="var(--primary-light)" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
                      Haga clic para tomar foto o seleccionar archivo
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                      PNG, JPG o WebP hasta 8MB
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
                    maxHeight: '220px',
                    border: '1px solid var(--border-glass)',
                    background: '#000'
                  }}>
                    <img
                      src={comprobanteArchivo}
                      alt="Comprobante Adjunto"
                      style={{ width: '100%', height: '220px', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setComprobanteArchivo('')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Quitar imagen"
                    >
                      <X size={18} />
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ minWidth: '180px', padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              <Send size={18} />
              <span>{submitting ? 'Enviando...' : 'Enviar Solicitud'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
