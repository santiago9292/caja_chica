import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, FileText, Receipt, Eye, Search, AlertCircle } from 'lucide-react';

export function MisSolicitudes({ currentUser, solicitudes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Filtrar solo las solicitudes del usuario logueado
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
      {/* Resumen de Mis Solicitudes */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{misItems.length}</div>
            <div className="stat-label">Mis Solicitudes Totales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">S/ {totalPendiente.toFixed(2)}</div>
            <div className="stat-label">En Evaluación (Pendientes)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">S/ {totalMontoAprobado.toFixed(2)}</div>
            <div className="stat-label">Total Aprobado / Reembolsado</div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-faint)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar entre mis solicitudes por código, motivo o comprobante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Mis Solicitudes */}
      {itemsFiltrados.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Clock size={40} color="var(--text-faint)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
            No se encontraron solicitudes registradas
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Puedes registrar una nueva solicitud o rendición desde la pestaña "Ingreso de Solicitud".
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
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-light)' }}>
                        {item.codigo}
                      </span>
                    </td>
                    <td>{new Date(item.created_at).toLocaleDateString('es-PE')}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {item.tipo === 'ADELANTO_DINERO' ? '💵 Adelanto' : '🧾 Rendición'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                        {item.categoria.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.motivo}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '800', color: '#fff' }}>
                        S/ {Number(item.monto).toFixed(2)}
                      </span>
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
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={15} />
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

      {/* Modal Detalle para el Solicitante */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
                Solicitud {selectedItem.codigo}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="btn btn-ghost btn-icon">
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38bdf8' }}>
                  S/ {Number(selectedItem.monto).toFixed(2)}
                </div>
              </div>
              <div>
                <span className={`badge ${
                  selectedItem.estado === 'APROBADO' ? 'badge-aprobado' :
                  selectedItem.estado === 'RECHAZADO' ? 'badge-rechazado' : 'badge-pendiente'
                }`} style={{ fontSize: '0.85rem' }}>
                  {selectedItem.estado}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Justificación</label>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#cbd5e1', fontSize: '0.9rem' }}>
                {selectedItem.motivo}
              </div>
            </div>

            {selectedItem.observaciones_aprobador && (
              <div style={{
                background: selectedItem.estado === 'APROBADO' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${selectedItem.estado === 'APROBADO' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>
                  Respuesta de Administración:
                </div>
                <div>{selectedItem.observaciones_aprobador}</div>
                {selectedItem.aprobado_por_nombre && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '0.4rem' }}>
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
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: '#000' }} 
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
