import React, { useState } from 'react';
import { Clock, CheckCircle2, FileText, Eye, Search, Receipt, FileSpreadsheet, Paperclip, Download, AlertTriangle } from 'lucide-react';
import { ModalRendicion, getTipoLabel } from './ModalRendicion';

export function MisSolicitudes({ currentUser, solicitudes, onRendirAdelanto }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [rendicionItem, setRendicionItem] = useState(null);

  const misItems = solicitudes.filter(s => s.solicitante_dni === currentUser.dni);

  const itemsFiltrados = misItems.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      s.codigo.toLowerCase().includes(q) ||
      s.motivo.toLowerCase().includes(q) ||
      s.categoria.toLowerCase().includes(q) ||
      s.estado.toLowerCase().includes(q)
    );
  });

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'APROBADO':
        return <span className="badge badge-aprobado">Aprobado</span>;
      case 'LIQUIDADO':
        return <span className="badge badge-liquidado">Liquidado</span>;
      case 'RENDIDO':
        return <span className="badge badge-aprobado">Rendido</span>;
      case 'POR_RENDIR':
        return <span className="badge badge-pendiente">Por Rendir</span>;
      case 'PENDIENTE_REEMBOLSO':
        return <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>Reembolso en Revisión</span>;
      case 'POR_REEMBOLSAR':
        return <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>Reembolso por Cobrar</span>;
      case 'POR_DEVOLVER':
        return <span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>Por Devolver a Caja</span>;
      case 'RECHAZADO':
        return <span className="badge badge-rechazado">Rechazado</span>;
      default:
        return <span className="badge badge-pendiente">{estado?.replace(/_/g, ' ') || 'Pendiente'}</span>;
    }
  };

  const totalMontoAprobado = misItems
    .filter(s => ['APROBADO', 'RENDIDO', 'LIQUIDADO', 'POR_RENDIR', 'POR_REEMBOLSAR', 'POR_DEVOLVER'].includes(s.estado))
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const totalPendiente = misItems
    .filter(s => ['PENDIENTE', 'PENDIENTE_REEMBOLSO'].includes(s.estado))
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  return (
    <div>
      {/* Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="stat-value">{misItems.length}</div>
            <div className="stat-label">Mis Solicitudes Totales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-value">S/ {totalPendiente.toFixed(2)}</div>
            <div className="stat-label">En Trámite (Pendientes)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-value">S/ {totalMontoAprobado.toFixed(2)}</div>
            <div className="stat-label">Total Aprobado / Rendido</div>
          </div>
        </div>
      </div>

      {/* Banner de Recordatorio de Liquidaciones Pendientes por Rendir */}
      {(() => {
        const pendientesRendir = misItems.filter(s => s.estado === 'POR_RENDIR');
        if (pendientesRendir.length === 0) return null;

        return (
          <div 
            className="glass-panel" 
            style={{ 
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
              border: '1.5px solid #fcd34d', 
              borderRadius: '12px',
              padding: '1.1rem 1.25rem', 
              marginBottom: '1.25rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: '#f59e0b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: '700', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>Tienes {pendientesRendir.length === 1 ? '1 liquidación pendiente por rendir' : `${pendientesRendir.length} liquidaciones pendientes por rendir`}</span>
                    <span style={{ fontSize: '0.68rem', background: '#b45309', color: '#fff', padding: '0.12rem 0.5rem', borderRadius: '20px', fontWeight: '700' }}>
                      Recordatorio cada 4h
                    </span>
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#78350f' }}>
                    Se te entregó efectivo para estos adelantos. Recuerda adjuntar los comprobantes de gasto (facturas/boletas) para sustentar y cerrar tu rendición.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {pendientesRendir.map((item) => {
                const fechaBase = new Date(item.pagado_fecha || item.abono_fecha || item.created_at);
                const horasPasadas = Math.floor((Date.now() - fechaBase.getTime()) / (1000 * 60 * 60));
                const esMayorA4Horas = horasPasadas >= 4;

                return (
                  <div 
                    key={item.id} 
                    style={{ 
                      background: '#ffffff', 
                      borderRadius: '8px', 
                      padding: '0.85rem 1rem', 
                      border: esMayorA4Horas ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{item.codigo}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#b45309', background: '#fef3c7', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            {item.categoria}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.2rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.motivo}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: '#b45309' }}>
                          S/ {Number(item.monto || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: esMayorA4Horas ? '#dc2626' : '#64748b', fontWeight: esMayorA4Horas ? '700' : '500', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '0.15rem' }}>
                          <Clock size={11} />
                          <span>{horasPasadas > 0 ? `Entregado hace ${horasPasadas}h` : 'Entregado hace <1h'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.72rem', color: esMayorA4Horas ? '#b45309' : '#64748b', fontWeight: '500' }}>
                        {esMayorA4Horas ? '⏰ Tiempo transcurrido > 4h' : 'En plazo normal'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRendicionItem(item)}
                        className="btn"
                        style={{
                          background: '#d97706',
                          color: '#ffffff',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Receipt size={13} />
                        <span>Rendir Ahora</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar entre mis solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      {itemsFiltrados.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Clock size={36} color="var(--text-faint)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#0f172a', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
            No se encontraron solicitudes
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Registra una nueva solicitud desde la pestaña "Ingreso de Solicitud".
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
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Concepto</th>
                  <th>Monto S/</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        {item.codigo}
                      </span>
                    </td>
                    <td>{new Date(item.created_at).toLocaleDateString('es-PE')}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {item.tipo === 'ADELANTO_DINERO' ? 'Adelanto' : 'Rendición'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {item.categoria.replace(/_/g, ' ')}
                      </span>
                      {item.centro_costo && (
                        <div style={{ fontSize: '0.7rem', color: '#0369a1', fontFamily: 'monospace', fontWeight: '700', marginTop: '2px' }}>
                          {item.centro_costo}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.motivo}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        S/ {Number(item.monto).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      {renderBadgeEstado(item.estado)}
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      {item.estado === 'POR_RENDIR' && (
                        <button
                          onClick={() => setRendicionItem(item)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          <Receipt size={14} />
                          <span>Rendir</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={14} />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                Solicitud {selectedItem.codigo}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="btn btn-ghost btn-icon">
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monto</span>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
                  S/ {Number(selectedItem.monto).toFixed(2)}
                </div>
              </div>
              <div>
                {renderBadgeEstado(selectedItem.estado)}
              </div>
            </div>

            {selectedItem.estado === 'POR_REEMBOLSAR' && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                color: '#065f46'
              }}>
                <strong>🎉 Reembolso Aprobado:</strong> Acércate a Caja para cobrar el efectivo adicional correspondiente al exceso de tus comprobantes.
              </div>
            )}

            {selectedItem.estado === 'POR_DEVOLVER' && (() => {
              let rendido = 0;
              try {
                const list = typeof selectedItem.rendiciones === 'string' ? JSON.parse(selectedItem.rendiciones) : selectedItem.rendiciones;
                if (Array.isArray(list)) rendido = list.reduce((sum, c) => sum + Number(c.monto || 0), 0);
              } catch (e) {}
              const aDevolver = Math.max(0, Number(selectedItem.monto || 0) - rendido);
              return (
                <div style={{
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.825rem',
                  color: '#5b21b6'
                }}>
                  <strong>💵 Devolución Pendiente:</strong> Rendiste S/ {rendido.toFixed(2)}. Acércate a Caja a devolver <strong>S/ {aDevolver.toFixed(2)}</strong>. Tu rendición quedará conforme cuando el cajero confirme la recepción.
                </div>
              );
            })()}

            {selectedItem.estado === 'PENDIENTE_REEMBOLSO' && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                color: '#92400e'
              }}>
                <strong>⏳ Reembolso en Revisión:</strong> Has rendido un monto superior a tu adelanto. Administración está validando tus comprobantes para autorizar la entrega de tu dinero en Caja.
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Justificación</label>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#334155', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
                {selectedItem.motivo}
              </div>
            </div>

            {selectedItem.observaciones_aprobador && (
              <div style={{
                background: selectedItem.estado === 'APROBADO' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${selectedItem.estado === 'APROBADO' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.825rem'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '0.2rem', color: selectedItem.estado === 'APROBADO' ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  Observación de Administración:
                </div>
                <div>{selectedItem.observaciones_aprobador}</div>
                {selectedItem.aprobado_por_nombre && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.35rem' }}>
                    Por: {selectedItem.aprobado_por_nombre} el {new Date(selectedItem.aprobado_fecha).toLocaleString('es-PE')}
                  </div>
                )}
              </div>
            )}

            {selectedItem.abono_sustento_url && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857' }}>
                  <CheckCircle2 size={15} /> Sustento de Entrega / Abono de Dinero
                </label>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span><strong>Modalidad:</strong> {selectedItem.abono_metodo || 'Efectivo en Caja'} {selectedItem.abono_operacion ? `(Ref: ${selectedItem.abono_operacion})` : ''}</span>
                    {selectedItem.pagado_por_nombre && (
                      <span style={{ color: 'var(--text-muted)' }}>Por: {selectedItem.pagado_por_nombre}</span>
                    )}
                  </div>
                  {selectedItem.abono_sustento_url.startsWith('data:image/') ? (
                    <img 
                      src={selectedItem.abono_sustento_url} 
                      alt="Comprobante de Abono" 
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: '#ffffff', border: '1px solid #cbd5e1' }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>
                        📎 {selectedItem.abono_sustento_nombre || 'Comprobante de abono adjunto'}
                      </span>
                      <a href={selectedItem.abono_sustento_url} download="sustento_abono" className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                        Descargar
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedItem.comprobante_archivo_url && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Comprobante Original</label>
                <img 
                  src={selectedItem.comprobante_archivo_url} 
                  alt="Comprobante" 
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: '#f8fafc', border: '1px solid #cbd5e1' }} 
                />
              </div>
            )}

            {(() => {
              let rends = [];
              try {
                if (selectedItem.rendiciones) {
                  rends = typeof selectedItem.rendiciones === 'string' ? JSON.parse(selectedItem.rendiciones) : selectedItem.rendiciones;
                }
              } catch (e) {
                console.error("Error parseando rendiciones", e);
              }

              if (rends.length > 0) {
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Comprobantes y Sustentos Rendidos ({rends.length})</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {rends.map((r, i) => {
                        const isImage = r.archivo && (r.archivo.startsWith('data:image/') || (!r.archivoNombre && !r.archivo.includes('application/')));
                        return (
                          <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b' }}>
                                {getTipoLabel(r.tipo)} {r.numero ? `• ${r.numero}` : ''}
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>
                                S/ {Number(r.monto).toFixed(2)}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              {r.razonSocial ? `${r.razonSocial} | ` : ''}{r.ruc ? `RUC: ${r.ruc} | ` : ''}{r.fecha}
                            </div>
                            {r.archivo && (
                              isImage ? (
                                <img 
                                  src={r.archivo} 
                                  alt={`Rendicion ${i}`} 
                                  style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-sm)', background: '#ffffff' }} 
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Paperclip size={14} color="#2563eb" /> {r.archivoNombre || 'Documento adjunto'}
                                  </span>
                                  <a 
                                    href={r.archivo} 
                                    download={r.archivoNombre || `sustento_${r.tipo}_${i + 1}`} 
                                    className="btn btn-secondary" 
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <Download size={12} /> Descargar
                                  </a>
                                </div>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
              <button onClick={() => setSelectedItem(null)} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rendición */}
      {rendicionItem && (
        <ModalRendicion
          solicitud={rendicionItem}
          onClose={() => setRendicionItem(null)}
          onRendir={onRendirAdelanto}
        />
      )}
    </div>
  );
}
