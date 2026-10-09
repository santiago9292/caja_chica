import React, { useState } from 'react';
import { 
  X, 
  Banknote, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Paperclip, 
  Send,
  Loader2
} from 'lucide-react';
import { playNotificationSound } from '../lib/audioNotifier';

const METODOS_ABONO = [
  { id: 'EFECTIVO_CAJA', label: 'Efectivo en Ventanilla / Caja' },
  { id: 'YAPE', label: 'Transferencia Yape' },
  { id: 'PLIN', label: 'Transferencia Plin' },
  { id: 'BCP', label: 'Transferencia BCP' },
  { id: 'BBVA', label: 'Transferencia BBVA' },
  { id: 'INTERBANK', label: 'Transferencia Interbank' },
  { id: 'TRANSFERENCIA_OTRO', label: 'Transferencia Otros Bancos' }
];

function getFileCategory(dataUrl, fileName = '', fileType = '') {
  const name = (fileName || '').toLowerCase();
  const type = (fileType || '').toLowerCase();
  const url = (dataUrl || '').toLowerCase();

  if (url.startsWith('data:image/') || type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name)) {
    return 'image';
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || type.includes('spreadsheet') || type.includes('excel') || url.includes('spreadsheetml') || url.includes('ms-excel')) {
    return 'excel';
  }
  if (name.endsWith('.docx') || name.endsWith('.doc') || type.includes('word') || url.includes('wordprocessingml') || url.includes('msword')) {
    return 'word';
  }
  if (name.endsWith('.pdf') || type.includes('pdf') || url.startsWith('data:application/pdf')) {
    return 'pdf';
  }
  return 'file';
}

export function ModalAbono({
  isOpen,
  onClose,
  solicitud,
  montoDisponible = 0,
  onConfirmar
}) {
  if (!isOpen || !solicitud) return null;

  const isReembolso = solicitud.estado === 'POR_REEMBOLSAR';
  const isDevolucion = solicitud.estado === 'POR_DEVOLVER';

  // Calcular monto exacto
  const getMontoEntrega = () => {
    if (isReembolso) {
      let totalRendido = 0;
      if (solicitud.rendiciones) {
        try {
          const list = typeof solicitud.rendiciones === 'string' ? JSON.parse(solicitud.rendiciones) : solicitud.rendiciones;
          if (Array.isArray(list)) totalRendido = list.reduce((sum, c) => sum + Number(c.monto || 0), 0);
        } catch (e) {}
      }
      return Math.max(0, Number((totalRendido - Number(solicitud.monto || 0)).toFixed(2)));
    }
    if (isDevolucion) {
      let totalRendido = 0;
      if (solicitud.rendiciones) {
        try {
          const list = typeof solicitud.rendiciones === 'string' ? JSON.parse(solicitud.rendiciones) : solicitud.rendiciones;
          if (Array.isArray(list)) totalRendido = list.reduce((sum, c) => sum + Number(c.monto || 0), 0);
        } catch (e) {}
      }
      return Math.max(0, Number((Number(solicitud.monto || 0) - totalRendido).toFixed(2)));
    }
    return Number(solicitud.monto || 0);
  };

  const montoAEntregar = getMontoEntrega();

  const [metodo, setMetodo] = useState('EFECTIVO_CAJA');
  const [nroOperacion, setNroOperacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [archivo, setArchivo] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('');
  const [archivoTipo, setArchivoTipo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no debe superar los 15MB.');
      return;
    }

    setArchivoNombre(file.name);
    setArchivoTipo(file.type || '');

    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = (uploadEvent) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1280;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setArchivo(dataUrl);
        };
        img.onerror = () => {
          setArchivo(uploadEvent.target.result);
        };
        img.src = uploadEvent.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (uploadEvent) => {
        setArchivo(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isDevolucion && montoDisponible < montoAEntregar) {
      setErrorMsg('Fondos insuficientes en la Caja Chica para realizar este desembolso.');
      return;
    }

    if (!archivo) {
      setErrorMsg('Es obligatorio adjuntar el sustento (foto del comprobante de abono, transferencia, Yape o recibo firmado).');
      return;
    }

    setSubmitting(true);
    try {
      let nuevoEstado = 'POR_RENDIR';
      let obsFinal = observaciones.trim();

      if (isReembolso) {
        nuevoEstado = 'RENDIDO';
        obsFinal = obsFinal ? `Reembolso entregado: ${obsFinal}` : 'Reembolso por exceso entregado y sustentado';
      } else if (isDevolucion) {
        nuevoEstado = 'RENDIDO';
        obsFinal = obsFinal ? `Devolución recibida: ${obsFinal}` : 'Devolución de sobrante recibida y sustentada en caja';
      }

      const metodoLabel = METODOS_ABONO.find(m => m.id === metodo)?.label || metodo;
      const extraData = {
        abono_sustento_url: archivo,
        abono_sustento_nombre: archivoNombre || `${solicitud.codigo}_abono.jpg`,
        abono_metodo: metodoLabel,
        abono_operacion: (nroOperacion || '').trim().toUpperCase(),
        abono_observacion: observaciones.trim(),
        abono_fecha: new Date().toISOString()
      };

      await onConfirmar(solicitud.id, nuevoEstado, obsFinal, extraData);
      playNotificationSound('success');
      onClose();
    } catch (err) {
      setErrorMsg('Error al procesar: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const fileCategory = getFileCategory(archivo, archivoNombre, archivoTipo);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isDevolucion ? '#6d28d9' : '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Banknote size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                {isDevolucion ? 'Confirmar Recepción de Devolución' : isReembolso ? 'Entregar Reembolso por Exceso' : 'Entregar Dinero / Abono'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem', margin: 0 }}>
                Código: <strong>{solicitud.codigo}</strong> | Solicitante: <strong>{solicitud.solicitante_nombre}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-close" disabled={submitting}>
            <X size={20} />
          </button>
        </div>

        {/* Tarjeta de Importe */}
        <div style={{ 
          background: isDevolucion ? '#f5f3ff' : '#ecfdf5', 
          border: `1px solid ${isDevolucion ? '#ddd6fe' : '#a7f3d0'}`, 
          borderRadius: 'var(--radius-md)', 
          padding: '1rem', 
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', color: isDevolucion ? '#6d28d9' : '#047857' }}>
              {isDevolucion ? 'Monto a Recibir en Caja' : isReembolso ? 'Monto de Reembolso a Pagar' : 'Monto de Adelanto a Entregar'}
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: isDevolucion ? '#4c1d95' : '#065f46' }}>
              S/ {montoAEntregar.toFixed(2)}
            </div>
          </div>

          {!isDevolucion && (
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
              <div>Disponible actual en Caja:</div>
              <strong style={{ color: montoDisponible >= montoAEntregar ? '#059669' : '#dc2626', fontSize: '0.9rem' }}>
                S/ {montoDisponible.toFixed(2)}
              </strong>
            </div>
          )}
        </div>

        <form onSubmit={handleGuardar}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Modalidad de Entrega / Abono *</label>
              <select
                className="form-select"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                required
              >
                {METODOS_ABONO.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">N° Operación / Referencia (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="EJ: OP-948218 / RECIBO 012"
                value={nroOperacion}
                onChange={(e) => setNroOperacion(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Sustento Obligatorio */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: '700', color: '#0f172a' }}>
                Sustento del Abono / Comprobante de Entrega <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: '#dc2626', background: '#fef2f2', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: '600' }}>
                Obligatorio
              </span>
            </div>

            {!archivo ? (
              <label style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '1.25rem 1rem', 
                border: '2px dashed #94a3b8', 
                borderRadius: 'var(--radius-md)', 
                cursor: 'pointer', 
                background: '#f8fafc',
                transition: 'all 0.2s ease'
              }}>
                <Upload size={24} color="#059669" style={{ marginBottom: '0.35rem' }} />
                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600' }}>
                  Subir voucher de transferencia o foto del recibo firmado
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Captura de Yape / Plin / Transferencia Bancaria o Foto — Máx. 15MB
                </span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
              </label>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff', padding: fileCategory === 'image' ? 0 : '1rem' }}>
                {fileCategory === 'image' ? (
                  <div style={{ background: '#0f172a', textAlign: 'center' }}>
                    <img src={archivo} alt="Sustento de Abono" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ecfdf5',
                      color: '#059669'
                    }}>
                      <Paperclip size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {archivoNombre || 'Sustento adjunto cargado'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>
                        ✓ Listo para registrar
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  type="button" 
                  onClick={() => {
                    setArchivo('');
                    setArchivoNombre('');
                    setArchivoTipo('');
                  }} 
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
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} 
                  title="Eliminar archivo"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Observaciones de Caja (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Entregado en mano propia en planta o transferido a cuenta BCP"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary" 
              disabled={submitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting || !archivo}
              style={{ fontWeight: '700' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar y Registrar Entrega</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
