import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Receipt, 
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playNotificationSound } from '../lib/audioNotifier';

export function ModuloAprobacion({ currentUser, solicitudes, onUpdateEstado }) {
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR');

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '2rem auto',
        border: '1px solid var(--danger-border)',
        background: 'var(--danger-bg)'
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: '#ffffff',
          border: '1px solid var(--danger-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <ShieldAlert size={28} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.5rem' }}>
          Módulo de Aprobación Restringido
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
          Este módulo es exclusivo para usuarios con rol de <strong>ADMINISTRADOR</strong>.
        </p>
        <div style={{
          display: 'inline-block',
          padding: '0.35rem 0.85rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          border: '1px solid #e2e8f0'
        }}>
          Tus roles registrados: {currentUser?.roles?.join(', ') || 'Sin roles'}
        </div>
      </div>
    );
  }

  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
  const [selectedItem, setSelectedItem] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazoDialog, setShowRechazoDialog] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado === 'TODOS') return true;
    return s.estado === filtroEstado;
  });

  const pendientesCount = solicitudes.filter(s => s.estado === 'PENDIENTE').length;

  const handleAprobar = async (item) => {
    setProcessingId(item.id);
    try {
      await onUpdateEstado(item.id, 'APROBADO', 'Aprobado conforme');
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        console.log(e);
      }
      playNotificationSound('success');
      setSelectedItem(null);
    } catch (err) {
      alert('Error al aprobar: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazarConfirm = async () => {
    if (!selectedItem) return;
    if (!motivoRechazo.trim()) {
      alert('Debe ingresar un motivo para el rechazo.');
      return;
    }

    setProcessingId(selectedItem.id);
    try {
      await onUpdateEstado(selectedItem.id, 'RECHAZADO', motivoRechazo.trim());
      playNotificationSound('reject');
      setShowRechazoDialog(false);
      setMotivoRechazo('');
      setSelectedItem(null);
    } catch (err) {
      alert('Error al rechazar: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      
      {/* Encabezado */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Bandeja de Aprobaciones</span>
            {pendientesCount > 0 && (
              <span className="badge badge-pendiente">
                {pendientesCount} Pendientes
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Administrador: <strong>{currentUser?.nombres} {currentUser?.apellidos}</strong> (DNI: {currentUser?.dni})
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'PENDIENTE', label: 'Pendientes', count: pendientesCount },
            { id: 'APROBADO', label: 'Aprobados' },
            { id: 'RECHAZADO', label: 'Rechazados' },
            { id: 'TODOS', label: 'Todos' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroEstado(f.id)}
              className="btn btn-ghost"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: filtroEstado === f.id ? '#ffffff' : 'transparent',
                color: filtroEstado === f.id ? '#0f172a' : 'var(--text-muted)',
                boxShadow: filtroEstado === f.id ? 'var(--shadow-sm)' : 'none',
                fontWeight: filtroEstado === f.id ? '700' : '500'
              }}
            >
              {f.label} {f.count !== undefined && f.count > 0 ? `(${f.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      {solicitudesFiltradas.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Clock size={36} color="var(--text-faint)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#0f172a', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
            No hay solicitudes en estado {filtroEstado.toLowerCase()}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Las solicitudes registradas aparecerán aquí automáticamente en tiempo real.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0.75rem' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Solicitante</th>
                  <th>Operación</th>
                  <th>Categoría</th>
                  <th>Comprobante</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((sol) => (
                  <tr key={sol.id}>
                    <td>
                      <span style={{ color: '#0f172a', fontFamily: 'monospace', fontWeight: '700' }}>
                        {sol.codigo}
                      </span>
                    </td>
                    <td>{new Date(sol.created_at).toLocaleDateString('es-PE')}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{sol.solicitante_nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>DNI: {sol.solicitante_dni}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {sol.tipo === 'ADELANTO_DINERO' ? 'Adelanto' : 'Rendición'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {sol.categoria.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {sol.comprobante_tipo ? (
                        <div style={{ fontSize: '0.78rem' }}>
                          <div>{sol.comprobante_tipo.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{sol.comprobante_numero || '-'}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                        S/ {Number(sol.monto).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        sol.estado === 'APROBADO' ? 'badge-aprobado' :
                        sol.estado === 'RECHAZADO' ? 'badge-rechazado' : 'badge-pendiente'
                      }`}>
                        {sol.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => setSelectedItem(sol)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          <Eye size={14} />
                          <span>Revisar</span>
                        </button>

                        {sol.estado === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => handleAprobar(sol)}
                              disabled={processingId === sol.id}
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              <Check size={14} />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(sol);
                                setShowRechazoDialog(true);
                              }}
                              disabled={processingId === sol.id}
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              <X size={14} />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedItem && !showRechazoDialog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-admin" style={{ marginBottom: '0.25rem' }}>
                  Evaluación de Solicitud
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                  {selectedItem.codigo}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Ficha Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Solicitante</span>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>{selectedItem.solicitante_nombre}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>DNI: {selectedItem.solicitante_dni}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monto Solicitado</span>
                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.3rem' }}>
                  S/ {Number(selectedItem.monto).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedItem.tipo === 'ADELANTO_DINERO' ? 'Adelanto de Efectivo' : 'Rendición de Gasto'}</div>
              </div>
            </div>

            {/* Concepto */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Concepto / Justificación</label>
              <div style={{
                background: '#f8fafc',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                color: '#334155',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0'
              }}>
                {selectedItem.motivo}
              </div>
            </div>

            {/* Comprobante */}
            {selectedItem.comprobante_tipo && (
              <div style={{
                background: '#f8fafc',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.825rem', marginBottom: '0.5rem' }}>
                  Sustento de Comprobante
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tipo: </span><strong>{selectedItem.comprobante_tipo}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>N°: </span><strong>{selectedItem.comprobante_numero || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>RUC: </span><strong>{selectedItem.comprobante_ruc_emisor || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Proveedor: </span><strong>{selectedItem.comprobante_razon_social || '-'}</strong></div>
                </div>

                {selectedItem.comprobante_archivo_url && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Foto / Voucher:
                    </span>
                    <img 
                      src={selectedItem.comprobante_archivo_url} 
                      alt="Voucher" 
                      style={{
                        width: '100%',
                        maxHeight: '180px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-sm)',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <button type="button" onClick={() => setSelectedItem(null)} className="btn btn-secondary">
                Cerrar
              </button>

              {selectedItem.estado === 'PENDIENTE' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRechazoDialog(true)}
                    className="btn btn-danger"
                    disabled={processingId === selectedItem.id}
                  >
                    <XCircle size={16} />
                    <span>Rechazar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAprobar(selectedItem)}
                    className="btn btn-success"
                    disabled={processingId === selectedItem.id}
                  >
                    <CheckCircle size={16} />
                    <span>Aprobar Solicitud</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Rechazo Dialog */}
      {showRechazoDialog && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem', color: '#dc2626' }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Rechazar Solicitud {selectedItem.codigo}</h3>
            </div>
            
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              Ingrese el motivo del rechazo para notificar al solicitante:
            </p>

            <div className="form-group">
              <label className="form-label">Motivo u Observación *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Indique la observación..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowRechazoDialog(false);
                  setMotivoRechazo('');
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={processingId === selectedItem.id || !motivoRechazo.trim()}
                onClick={handleRechazarConfirm}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
