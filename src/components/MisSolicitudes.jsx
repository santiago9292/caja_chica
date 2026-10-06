import React, { useState } from 'react';
import { Clock, CheckCircle2, FileText, Eye, Search } from 'lucide-react';

export function MisSolicitudes({ currentUser, solicitudes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

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

  const totalMontoAprobado = misItems
    .filter(s => s.estado === 'APROBADO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const totalPendiente = misItems
    .filter(s => s.estado === 'PENDIENTE')
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
                      <span className={`badge ${
                        item.estado === 'APROBADO' ? 'badge-aprobado' :
                        item.estado === 'RECHAZADO' ? 'badge-rechazado' : 'badge-pendiente'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
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
                <span className={`badge ${
                  selectedItem.estado === 'APROBADO' ? 'badge-aprobado' :
                  selectedItem.estado === 'RECHAZADO' ? 'badge-rechazado' : 'badge-pendiente'
                }`}>
                  {selectedItem.estado}
                </span>
              </div>
            </div>

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

            {selectedItem.comprobante_archivo_url && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Comprobante Adjunto</label>
                <img 
                  src={selectedItem.comprobante_archivo_url} 
                  alt="Comprobante" 
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: '#f8fafc', border: '1px solid #cbd5e1' }} 
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
              <button onClick={() => setSelectedItem(null)} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
