import React, { useState } from 'react';
import { Upload, X, Receipt, CheckCircle, Plus } from 'lucide-react';

const TIPOS_COMPROBANTE = [
  { id: 'FACTURA', label: 'Factura Electrónica' },
  { id: 'BOLETA', label: 'Boleta de Venta' },
  { id: 'RECIBO_HONORARIOS', label: 'Recibo por Honorarios' },
  { id: 'TICKET_VALE', label: 'Ticket / Vale Autorizado' },
  { id: 'DECLARACION_JURADA', label: 'Declaración Jurada de Gasto' },
  { id: 'SIN_COMPROBANTE', label: 'Sin Comprobante Físico' }
];

export function ModalRendicion({ solicitud, onClose, onRendir }) {
  const [comprobantes, setComprobantes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Estado del formulario actual
  const [tipo, setTipo] = useState('FACTURA');
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no debe superar los 15MB.');
      return;
    }

    const reader = new FileReader();
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
  };

  const agregarComprobante = () => {
    if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
      alert("Ingrese un monto válido para el comprobante.");
      return;
    }
    const nuevo = {
      tipo,
      numero: (numero || '').trim().toUpperCase(),
      fecha,
      ruc: (ruc || '').trim(),
      razonSocial: (razonSocial || '').trim().toUpperCase(),
      monto: parseFloat(monto),
      archivo
    };
    setComprobantes([...comprobantes, nuevo]);
    // Resetear form parcial
    setNumero('');
    setRuc('');
    setRazonSocial('');
    setMonto('');
    setArchivo('');
  };

  const quitarComprobante = (idx) => {
    const arr = [...comprobantes];
    arr.splice(idx, 1);
    setComprobantes(arr);
  };

  const handleGuardar = async () => {
    if (comprobantes.length === 0) {
      alert("Debe agregar al menos un comprobante para rendir.");
      return;
    }
    setSubmitting(true);
    try {
      await onRendir(solicitud.id, comprobantes);
      onClose();
    } catch (err) {
      alert("Error al rendir: " + err.message);
      setSubmitting(false);
    }
  };

  const totalRendido = comprobantes.reduce((sum, c) => sum + c.monto, 0);
  const diferencia = totalRendido - Number(solicitud.monto);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Rendir Adelanto</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Código: <strong>{solicitud.codigo}</strong> | Adelanto: <strong>S/ {Number(solicitud.monto).toFixed(2)}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {/* Lista de Comprobantes Agregados */}
        {comprobantes.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#0f172a' }}>Comprobantes Adjuntos ({comprobantes.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {comprobantes.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong>{c.tipo} {c.numero}</strong> <br />
                    <span style={{ color: 'var(--text-faint)' }}>{c.razonSocial} | RUC: {c.ruc} | {c.fecha}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <strong style={{ color: '#0f172a' }}>S/ {c.monto.toFixed(2)}</strong>
                    <button type="button" onClick={() => quitarComprobante(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <span>Total Rendido: <strong>S/ {totalRendido.toFixed(2)}</strong></span>
              <span style={{ color: diferencia < 0 ? '#ef4444' : (diferencia > 0 ? '#f59e0b' : '#10b981') }}>
                {diferencia < 0 ? `Falta rendir / devolver: S/ ${Math.abs(diferencia).toFixed(2)}` : (diferencia > 0 ? `Exceso (A favor): S/ ${diferencia.toFixed(2)}` : 'Rendición exacta')}
              </span>
            </div>
          </div>
        )}

        {/* Formulario para agregar un comprobante */}
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt size={16} /> Agregar Comprobante
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo</label>
              <select className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS_COMPROBANTE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Serie y Número</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="EJ: F001-0012847" 
                value={numero} 
                onChange={(e) => setNumero(e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fecha</label>
              <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">RUC Proveedor</label>
              <input type="text" maxLength={11} className="form-input" placeholder="11 dígitos" value={ruc} onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Razón Social</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="NOMBRE O EMPRESA" 
                value={razonSocial} 
                onChange={(e) => setRazonSocial(e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Monto (S/) *</label>
              <input type="number" step="0.01" min="0.10" className="form-input" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <label className="form-label">Foto del Voucher / Comprobante</label>
            {!archivo ? (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: '#ffffff' }}>
                <Upload size={20} color="#64748b" style={{ marginBottom: '0.25rem' }} />
                <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: '600' }}>Tomar foto o seleccionar archivo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '180px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <img src={archivo} alt="Comprobante" style={{ width: '100%', height: '180px', objectFit: 'contain' }} />
                <button type="button" onClick={() => setArchivo('')} style={{ position: 'absolute', top: '8px', right: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Quitar"><X size={14} /></button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={agregarComprobante} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Agregar a la lista
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={submitting}>
            Cancelar
          </button>
          <button 
            onClick={handleGuardar} 
            className="btn btn-primary" 
            disabled={submitting || comprobantes.length === 0 || totalRendido < Number(solicitud.monto)}
            title={totalRendido < Number(solicitud.monto) ? "Debe rendir por lo menos el total del adelanto entregado." : ""}
          >
            {submitting ? 'Guardando...' : 'Finalizar Rendición'}
          </button>
        </div>
      </div>
    </div>
  );
}
