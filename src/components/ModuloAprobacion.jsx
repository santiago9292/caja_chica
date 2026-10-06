import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  FileText, 
  Receipt, 
  Calendar, 
  DollarSign, 
  Building2, 
  AlertTriangle,
  Sparkles,
  Filter,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playNotificationSound } from '../lib/audioNotifier';

export function ModuloAprobacion({ currentUser, solicitudes, onUpdateEstado }) {
  // 1. Verificación estricta de seguridad: Solo ADMINISTRADOR
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR');

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '650px',
        margin: '2rem auto',
        border: '1px solid var(--danger-border)',
        background: 'rgba(239, 68, 68, 0.05)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--danger-bg)',
          border: '2px solid var(--danger-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <ShieldAlert size={38} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.75rem' }}>
          Módulo de Aprobación Restringido
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Por directiva de control interno corporativo, el <strong>Módulo de Aprobación de Fondos y Rendiciones</strong> es exclusivo para usuarios con rol de <strong style={{ color: '#38bdf8' }}>ADMINISTRADOR</strong>.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          color: 'var(--text-faint)'
        }}>
          Tus roles registrados: {currentUser?.roles?.join(', ') || 'Sin roles asignados'}
        </div>
      </div>
    );
  }

  // Estado del componente de Aprobación
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
  const [selectedItem, setSelectedItem] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazoDialog, setShowRechazoDialog] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Filtrado de solicitudes
  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado === 'TODOS') return true;
    return s.estado === filtroEstado;
  });

  const pendientesCount = solicitudes.filter(s => s.estado === 'PENDIENTE').length;

  const handleAprobar = async (item) => {
    setProcessingId(item.id);
    try {
      await onUpdateEstado(item.id, 'APROBADO', 'Aprobado conforme por Administrador');
      
      // Confeti de celebración
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
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
      alert('Debe ingresar un motivo u observación para el rechazo.');
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
      
      {/* Encabezado del Módulo de Aprobación */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Bandeja de Aprobación de Caja Chica</span>
            {pendientesCount > 0 && (
              <span className="badge badge-pendiente" style={{ fontSize: '0.8rem' }}>
                {pendientesCount} Pendientes
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Aprobador Autorizado: <strong style={{ color: '#38bdf8' }}>{currentUser?.nombres} {currentUser?.apellidos}</strong> (DNI: {currentUser?.dni})
          </p>
        </div>

        {/* Filtros de Estado */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
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
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                background: filtroEstado === f.id ? 'var(--primary-gradient)' : 'transparent',
                color: filtroEstado === f.id ? '#fff' : 'var(--text-muted)'
              }}
            >
              {f.label} {f.count !== undefined && f.count > 0 ? `(${f.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Listado / Tabla de Solicitudes */}
      {solicitudesFiltradas.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Clock size={40} color="var(--text-faint)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
            No hay solicitudes en este estado ({filtroEstado})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Las solicitudes registradas por los colaboradores se reflejarán automáticamente en tiempo real.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Solicitante</th>
                  <th>Tipo Operación</th>
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
                      <strong style={{ color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                        {sol.codigo}
                      </strong>
                    </td>
                    <td>{new Date(sol.created_at).toLocaleDateString('es-PE')}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{sol.solicitante_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>DNI: {sol.solicitante_dni}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {sol.tipo === 'ADELANTO_DINERO' ? '💵 Adelanto' : '🧾 Rendición'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                        {sol.categoria.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {sol.comprobante_tipo ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>{sol.comprobante_tipo.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{sol.comprobante_numero || 'Sin número'}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
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
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setSelectedItem(sol)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          title="Ver detalle completo"
                        >
                          <Eye size={15} />
                          <span>Revisar</span>
                        </button>

                        {sol.estado === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => handleAprobar(sol)}
                              disabled={processingId === sol.id}
                              className="btn btn-success"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              title="Aprobar de inmediato"
                            >
                              <Check size={15} />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(sol);
                                setShowRechazoDialog(true);
                              }}
                              disabled={processingId === sol.id}
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              title="Rechazar solicitud"
                            >
                              <X size={15} />
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

      {/* Modal de Detalle de Solicitud y Decisión */}
      {selectedItem && !showRechazoDialog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <span className="badge badge-admin" style={{ marginBottom: '0.3rem' }}>
                  Evaluación de Solicitud
                </span>
                <h3 style={{ fontSize: '1.35rem', color: '#fff' }}>
                  {selectedItem.codigo}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="btn btn-ghost btn-icon"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ficha Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solicitante</span>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>{selectedItem.solicitante_nombre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>DNI: {selectedItem.solicitante_dni}</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto Solicitado</span>
                <div style={{ fontWeight: '800', color: '#38bdf8', fontSize: '1.4rem' }}>
                  S/ {Number(selectedItem.monto).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{selectedItem.tipo === 'ADELANTO_DINERO' ? 'Adelanto de Efectivo' : 'Rendición de Gasto'}</div>
              </div>
            </div>

            {/* Concepto / Motivo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Concepto / Justificación</label>
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                border: '1px solid var(--border-subtle)'
              }}>
                {selectedItem.motivo}
              </div>
            </div>

            {/* Datos de Comprobante si existen */}
            {selectedItem.comprobante_tipo && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                  Sustento de Comprobante
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Tipo: </span>
                    <strong style={{ color: '#fff' }}>{selectedItem.comprobante_tipo}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>N°: </span>
                    <strong style={{ color: '#fff' }}>{selectedItem.comprobante_numero || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>RUC: </span>
                    <strong style={{ color: '#fff' }}>{selectedItem.comprobante_ruc_emisor || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Proveedor: </span>
                    <strong style={{ color: '#fff' }}>{selectedItem.comprobante_razon_social || '-'}</strong>
                  </div>
                </div>

                {/* Imagen del comprobante adjunto si existe */}
                {selectedItem.comprobante_archivo_url && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Foto o Voucher Adjunto:
                    </span>
                    <img 
                      src={selectedItem.comprobante_archivo_url} 
                      alt="Voucher de sustento" 
                      style={{
                        width: '100%',
                        maxHeight: '220px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-sm)',
                        background: '#000',
                        border: '1px solid var(--border-glass)'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Estado Actual y Aprobador */}
            {selectedItem.estado !== 'PENDIENTE' && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: selectedItem.estado === 'APROBADO' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${selectedItem.estado === 'APROBADO' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <div><strong>Estado:</strong> {selectedItem.estado}</div>
                {selectedItem.aprobado_por_nombre && <div><strong>Evaluado por:</strong> {selectedItem.aprobado_por_nombre}</div>}
                {selectedItem.observaciones_aprobador && <div><strong>Observación:</strong> {selectedItem.observaciones_aprobador}</div>}
              </div>
            )}

            {/* Botones de Acción para Administrador */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setSelectedItem(null)} 
                className="btn btn-secondary"
              >
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
                    <XCircle size={17} />
                    <span>Rechazar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAprobar(selectedItem)}
                    className="btn btn-success"
                    disabled={processingId === selectedItem.id}
                  >
                    <CheckCircle size={17} />
                    <span>Aprobar Solicitud</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal para Motivo de Rechazo */}
      {showRechazoDialog && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Rechazar Solicitud {selectedItem.codigo}</h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Por favor indique el motivo o sustento del rechazo. El solicitante recibirá una notificación en tiempo real con este mensaje.
            </p>

            <div className="form-group">
              <label className="form-label">Motivo u Observación *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ej: El comprobante no cuenta con RUC válido, o el gasto excede el límite autorizado..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
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
