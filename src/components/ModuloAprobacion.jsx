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
  X,
  FileText,
  User,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playNotificationSound } from '../lib/audioNotifier';

export function ModuloAprobacion({ currentUser, solicitudes, onUpdateEstado }) {
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR');

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '1.5rem auto',
        border: '1px solid var(--danger-border)',
        background: 'var(--danger-bg)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: '#ffffff',
          border: '1px solid var(--danger-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.85rem'
        }}>
          <ShieldAlert size={26} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '0.4rem' }}>
          Módulo de Aprobación Restringido
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1rem' }}>
          Este módulo es exclusivo para usuarios con rol de <strong>ADMINISTRADOR</strong>.
        </p>
        <div style={{
          display: 'inline-block',
          padding: '0.35rem 0.85rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem',
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
  
  const [showAprobarDialog, setShowAprobarDialog] = useState(false);
  const [itemToAprobar, setItemToAprobar] = useState(null);
  const [comentarioAprobacion, setComentarioAprobacion] = useState('Aprobado conforme');
  const [processingId, setProcessingId] = useState(null);

  const getInfoRendicion = (item) => {
    if (!item?.rendiciones) return { totalRendido: 0, exceso: 0, lista: [] };
    let lista = [];
    try {
      lista = typeof item.rendiciones === 'string' ? JSON.parse(item.rendiciones) : item.rendiciones;
    } catch (e) {
      lista = [];
    }
    if (!Array.isArray(lista)) return { totalRendido: 0, exceso: 0, lista: [] };
    const totalRendido = lista.reduce((sum, c) => sum + Number(c.monto || 0), 0);
    const adelanto = Number(item.monto || 0);
    const exceso = Math.max(0, Number((totalRendido - adelanto).toFixed(2)));
    return { totalRendido, exceso, lista };
  };

  const renderBadgeEstado = (estado) => {
    if (estado === 'APROBADO') return <span className="badge badge-aprobado">APROBADO</span>;
    if (estado === 'POR_REEMBOLSAR') return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>POR REEMBOLSAR</span>;
    if (estado === 'PENDIENTE_REEMBOLSO') return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>REEMBOLSO PENDIENTE</span>;
    if (estado === 'RECHAZADO') return <span className="badge badge-rechazado">RECHAZADO</span>;
    return <span className="badge badge-pendiente">PENDIENTE</span>;
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado === 'TODOS') return true;
    if (filtroEstado === 'PENDIENTE') return s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_REEMBOLSO';
    if (filtroEstado === 'APROBADO') return s.estado === 'APROBADO' || s.estado === 'POR_REEMBOLSAR';
    return s.estado === filtroEstado;
  });

  const pendientesCount = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_REEMBOLSO').length;

  const handleOpenAprobar = (item) => {
    setItemToAprobar(item);
    const isReembolso = item.estado === 'PENDIENTE_REEMBOLSO';
    setComentarioAprobacion(isReembolso ? 'Aprobado reembolso de exceso' : 'Aprobado conforme');
    setShowAprobarDialog(true);
  };

  const handleAprobarConfirm = async () => {
    if (!itemToAprobar) return;
    setProcessingId(itemToAprobar.id);
    try {
      const isReembolso = itemToAprobar.estado === 'PENDIENTE_REEMBOLSO';
      const nuevoEstado = isReembolso ? 'POR_REEMBOLSAR' : 'APROBADO';
      const defaultComentario = isReembolso ? 'Aprobado reembolso de exceso' : 'Aprobado conforme';
      const comentario = comentarioAprobacion.trim() || defaultComentario;
      await onUpdateEstado(itemToAprobar.id, nuevoEstado, comentario);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        console.log(e);
      }
      playNotificationSound('success');
      setShowAprobarDialog(false);
      setItemToAprobar(null);
      setComentarioAprobacion('Aprobado conforme');
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
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
              Bandeja de Aprobaciones
            </h2>
            {pendientesCount > 0 && (
              <span className="badge badge-pendiente" style={{ fontSize: '0.75rem' }}>
                {pendientesCount} PENDIENTES
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Administrador: <strong>{currentUser?.nombres} {currentUser?.apellidos}</strong>
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '340px' }}>
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
                fontSize: '0.75rem',
                padding: '0.35rem 0.5rem',
                flex: 1,
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
        <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Clock size={36} color="var(--text-faint)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#0f172a', fontSize: '1rem', marginBottom: '0.25rem' }}>
            No hay solicitudes en estado {filtroEstado.toLowerCase()}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Las solicitudes registradas aparecerán aquí automáticamente en tiempo real.
          </p>
        </div>
      ) : (
        <>
          {/* VISTA MÓVIL: Tarjetas limpias (Para pantallas < 768px) */}
          <div className="mobile-only" style={{ flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            {solicitudesFiltradas.map((sol) => {
              const infoRend = getInfoRendicion(sol);
              const isReembolso = sol.estado === 'PENDIENTE_REEMBOLSO';
              const isPending = sol.estado === 'PENDIENTE' || sol.estado === 'PENDIENTE_REEMBOLSO';

              return (
                <div 
                  key={sol.id}
                  className="glass-panel"
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
                >
                  {/* Fila 1: Código, Fecha y Estado */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                        {sol.codigo}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                        • {new Date(sol.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </div>
                    {renderBadgeEstado(sol.estado)}
                  </div>

                  {/* Fila 2: Solicitante y Concepto */}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>
                      {sol.solicitante_nombre}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      DNI: {sol.solicitante_dni} • <span style={{ textTransform: 'capitalize' }}>{sol.categoria.toLowerCase().replace(/_/g, ' ')}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.35rem', background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                      {sol.motivo}
                    </div>
                  </div>

                  {/* Fila 3: Monto e Importe */}
                  {isReembolso ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', background: '#fffbeb', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '700' }}>
                          Exceso por Reembolsar
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Adelanto: S/ {Number(sol.monto).toFixed(2)} • Gastado: S/ {infoRend.totalRendido.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#16a34a' }}>
                        + S/ {infoRend.exceso.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sol.tipo === 'ADELANTO_DINERO' ? '💵 Adelanto Efectivo' : '🧾 Rendición con Comprobante'}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                        S/ {Number(sol.monto).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Fila 4: Acciones */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      onClick={() => setSelectedItem(sol)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                    >
                      <Eye size={14} />
                      <span>Revisar</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => handleOpenAprobar(sol)}
                          disabled={processingId === sol.id}
                          className="btn btn-success"
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                        >
                          <Check size={14} />
                          <span>{isReembolso ? 'Aprobar Reembolso' : 'Aprobar'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedItem(sol);
                            setShowRechazoDialog(true);
                          }}
                          disabled={processingId === sol.id}
                          className="btn btn-danger"
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                        >
                          <X size={14} />
                          <span>Rechazar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA DESKTOP / TABLET: Tabla Completa (Para pantallas >= 768px) */}
          <div className="glass-panel desktop-only" style={{ padding: '0.75rem', flexDirection: 'column', width: '100%' }}>
            <div className="table-responsive">
              <table className="data-table" style={{ minWidth: '780px' }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Código</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Fecha</th>
                    <th>Solicitante</th>
                    <th>Operación</th>
                    <th>Categoría</th>
                    <th>Comprobante</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Monto</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradas.map((sol) => {
                    const infoRend = getInfoRendicion(sol);
                    const isReembolso = sol.estado === 'PENDIENTE_REEMBOLSO';
                    const isPorReembolsar = sol.estado === 'POR_REEMBOLSAR';
                    const isPending = sol.estado === 'PENDIENTE' || sol.estado === 'PENDIENTE_REEMBOLSO';

                    return (
                      <tr key={sol.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#0f172a', fontFamily: 'monospace', fontWeight: '800', whiteSpace: 'nowrap' }}>
                            {sol.codigo}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(sol.created_at).toLocaleDateString('es-PE')}</td>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{sol.solicitante_nombre}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>DNI: {sol.solicitante_dni}</div>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.8rem' }}>
                            {isReembolso ? 'Reembolso Exceso' : isPorReembolsar ? 'Por Reembolsar' : sol.tipo === 'ADELANTO_DINERO' ? 'Adelanto' : 'Rendición'}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', whiteSpace: 'nowrap' }}>
                            {sol.categoria.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          {sol.comprobante_tipo ? (
                            <div style={{ fontSize: '0.78rem' }}>
                              <div>{sol.comprobante_tipo.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{sol.comprobante_numero || '-'}</div>
                            </div>
                          ) : infoRend.lista.length > 0 ? (
                            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '600' }}>
                              {infoRend.lista.length} comprobante(s)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isReembolso ? (
                            <div>
                              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#16a34a', whiteSpace: 'nowrap' }}>
                                S/ {infoRend.exceso.toFixed(2)}
                              </span>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Adel: S/ {Number(sol.monto).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                              S/ {Number(sol.monto).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td>
                          {renderBadgeEstado(sol.estado)}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => setSelectedItem(sol)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              <Eye size={14} />
                              <span>Revisar</span>
                            </button>

                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleOpenAprobar(sol)}
                                  disabled={processingId === sol.id}
                                  className="btn btn-success"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                >
                                  <Check size={14} />
                                  <span>{isReembolso ? 'Aprobar Reembolso' : 'Aprobar'}</span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Detalle */}
      {selectedItem && !showRechazoDialog && (() => {
        const infoRend = getInfoRendicion(selectedItem);
        const isReembolso = selectedItem.estado === 'PENDIENTE_REEMBOLSO';
        const isPending = selectedItem.estado === 'PENDIENTE' || isReembolso;

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
              
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Solicitante</span>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>{selectedItem.solicitante_nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>DNI: {selectedItem.solicitante_dni}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isReembolso ? 'Monto Adelantado' : 'Monto Solicitado'}
                  </span>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.3rem' }}>
                    S/ {Number(selectedItem.monto).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isReembolso ? 'Adelanto con rendición excedida' : selectedItem.tipo === 'ADELANTO_DINERO' ? 'Adelanto de Efectivo' : 'Rendición de Gasto'}
                  </div>
                </div>
              </div>

              {/* Si es reembolso o tiene rendiciones registradas */}
              {infoRend.lista.length > 0 && (
                <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>
                      Comprobantes de Rendición ({infoRend.lista.length})
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                      Total Sustentado: <strong>S/ {infoRend.totalRendido.toFixed(2)}</strong>
                    </span>
                  </div>

                  {infoRend.exceso > 0 && (
                    <div style={{ background: '#fffbeb', color: '#92400e', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '0.75rem', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>⚠️ <strong>Exceso pendiente de reembolso:</strong></span>
                      <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>+ S/ {infoRend.exceso.toFixed(2)}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {infoRend.lista.map((r, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#0f172a' }}>
                          <span>{r.tipo} {r.numero}</span>
                          <span style={{ color: '#0f172a' }}>S/ {Number(r.monto).toFixed(2)}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                          {r.razonSocial || '-'} {r.ruc ? `• RUC: ${r.ruc}` : ''} • Fecha: {r.fecha || '-'}
                        </div>
                        {r.archivo && (
                          <div style={{ marginTop: '0.35rem' }}>
                            <a href={r.archivo} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#2563eb', textDecoration: 'underline', display: 'inline-block', marginBottom: '0.25rem' }}>
                              Ver comprobante completo
                            </a>
                            <img src={r.archivo} alt={`Comprobante ${idx}`} style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concepto */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Concepto / Justificación</label>
                <div style={{
                  background: '#f8fafc',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  color: '#334155',
                  fontSize: '0.85rem',
                  border: '1px solid #e2e8f0'
                }}>
                  {selectedItem.motivo}
                </div>
              </div>

              {/* Comprobante Único (para rendiciones directas previas) */}
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
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

                {isPending && (
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
                      onClick={() => handleOpenAprobar(selectedItem)}
                      className="btn btn-success"
                      disabled={processingId === selectedItem.id}
                    >
                      <CheckCircle size={16} />
                      <span>{isReembolso ? 'Aprobar Reembolso' : 'Aprobar Solicitud'}</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Aprobación Dialog con Comentario */}
      {showAprobarDialog && itemToAprobar && (() => {
        const isReembolso = itemToAprobar.estado === 'PENDIENTE_REEMBOLSO';
        const infoRend = getInfoRendicion(itemToAprobar);

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#16a34a' }}>
                <CheckCircle size={22} />
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                  {isReembolso ? `Aprobar Reembolso de Exceso (${itemToAprobar.codigo})` : `Aprobar Solicitud ${itemToAprobar.codigo}`}
                </h3>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.83rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Solicitante:</span>
                  <strong style={{ color: '#0f172a' }}>{itemToAprobar.solicitante_nombre}</strong>
                </div>

                {isReembolso ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Adelanto entregado:</span>
                      <span>S/ {Number(itemToAprobar.monto).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total comprobantes rendidos:</span>
                      <strong style={{ color: '#0f172a' }}>S/ {infoRend.totalRendido.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ color: '#b45309', fontWeight: '700' }}>Monto de Reembolso a Autorizar:</span>
                      <strong style={{ color: '#16a34a', fontSize: '1.05rem' }}>S/ {infoRend.exceso.toFixed(2)}</strong>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monto a Entregar:</span>
                    <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>S/ {Number(itemToAprobar.monto).toFixed(2)}</strong>
                  </div>
                )}

                <div style={{ marginTop: '0.35rem', color: '#475569', fontSize: '0.78rem' }}>
                  <strong>Concepto:</strong> {itemToAprobar.motivo}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Comentario u Observación del Aprobador
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>(se guardará en Supabase)</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder={isReembolso ? "Ej: Aprobado reembolso de exceso conforme a comprobantes..." : "Ej: Aprobado conforme para trámites urgentes..."}
                  value={comentarioAprobacion}
                  onChange={(e) => setComentarioAprobacion(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAprobarDialog(false);
                    setItemToAprobar(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={processingId === itemToAprobar.id}
                  onClick={handleAprobarConfirm}
                >
                  {processingId === itemToAprobar.id ? 'Aprobando...' : isReembolso ? 'Autorizar Reembolso' : 'Confirmar Aprobación'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
