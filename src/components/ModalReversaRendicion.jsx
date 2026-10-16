import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, Check, FileText } from 'lucide-react';

export function ModalReversaRendicion({ solicitud, onClose, onConfirm, isProcessing }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (!solicitud) return null;

  const adelanto = Number(solicitud.monto || 0);
  let totalRendido = adelanto;
  if (solicitud.rendiciones) {
    try {
      const list = typeof solicitud.rendiciones === 'string' ? JSON.parse(solicitud.rendiciones) : solicitud.rendiciones;
      if (Array.isArray(list) && list.length > 0) {
        totalRendido = list.reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
      }
    } catch (e) {}
  }

  const diferencia = Number((totalRendido - adelanto).toFixed(2));
  const isDevolucion = solicitud.estado === 'POR_DEVOLVER' || diferencia < 0;
  const isExceso = solicitud.estado === 'PENDIENTE_REEMBOLSO' || solicitud.estado === 'POR_REEMBOLSAR' || diferencia > 0;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!motivo.trim()) {
      setError('Por favor ingresa un motivo para la reversa (ej. comprobante o importe erróneo).');
      return;
    }
    setError('');
    try {
      await onConfirm(motivo.trim());
    } catch (err) {
      setError(err.message || 'Error al revertir la rendición');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '520px', padding: '1.5rem' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: '#fef3c7', 
              color: '#d97706', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: '800' }}>
                Corregir / Revertir Rendición
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {solicitud.codigo} • Colaborador: {solicitud.solicitante_nombre}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-close" disabled={isProcessing}>
            <X size={18} />
          </button>
        </div>

        {/* Resumen del Gasto y Rendición Errónea */}
        <div style={{ 
          background: '#fffbeb', 
          border: '1px solid #fde68a', 
          borderRadius: '10px', 
          padding: '1rem', 
          marginBottom: '1.25rem' 
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: '#78350f', display: 'block', fontSize: '0.7rem', fontWeight: '600' }}>
                ADELANTO ENTREGADO
              </span>
              <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>
                S/ {adelanto.toFixed(2)}
              </strong>
            </div>

            <div>
              <span style={{ color: '#78350f', display: 'block', fontSize: '0.7rem', fontWeight: '600' }}>
                TOTAL RENDIDO
              </span>
              <strong style={{ color: '#dc2626', fontSize: '1.05rem', fontWeight: '800' }}>
                S/ {totalRendido.toFixed(2)}
              </strong>
            </div>

            <div>
              <span style={{ color: '#78350f', display: 'block', fontSize: '0.7rem', fontWeight: '600' }}>
                {isDevolucion ? 'SOBRANTE POR DEVOLVER' : isExceso ? 'EXCESO POR REEMBOLSAR' : 'DIFERENCIA'}
              </span>
              <strong style={{ color: isDevolucion ? '#7c3aed' : isExceso ? '#16a34a' : '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>
                {isDevolucion ? `S/ ${Math.abs(diferencia).toFixed(2)}` : isExceso ? `+ S/ ${diferencia.toFixed(2)}` : 'S/ 0.00'}
              </strong>
            </div>
          </div>

          <div style={{ 
            marginTop: '0.75rem', 
            paddingTop: '0.75rem', 
            borderTop: '1px dashed #fcd34d', 
            fontSize: '0.76rem', 
            color: '#92400e', 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.4rem' 
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              La solicitud retornará inmediatamente al estado <strong>POR RENDIR</strong> y se limpiarán los comprobantes ingresados por error. El colaborador podrá rendir nuevamente con los comprobantes e importes correctos. 
              <strong> El saldo de Caja Chica no se verá desajustado.</strong>
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.35rem', display: 'block' }}>
              Motivo de la reversión <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Ej: El colaborador digitó S/ 18.80 por error en lugar del importe real de la factura."
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError('');
              }}
              style={{ fontSize: '0.85rem', width: '100%', resize: 'none' }}
              disabled={isProcessing}
              autoFocus
            />
            {error && (
              <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: '600' }}>
                {error}
              </span>
            )}
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-warning"
              style={{
                background: '#d97706',
                borderColor: '#b45309',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: '700',
                padding: '0.55rem 1.25rem'
              }}
            >
              <RotateCcw size={16} />
              <span>{isProcessing ? 'Revirtiendo...' : 'Confirmar Reversa a Por Rendir'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
