import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  FileCheck, 
  CheckCircle2, 
  Layers,
  FileDown,
  Archive
} from 'lucide-react';
import { exportarCajaChicaExcel } from '../lib/excelExporter';
import { 
  exportarReporteCompletoZip, 
  descargarSustentosSolicitud, 
  getSustentosDeSolicitud 
} from '../lib/zipExporter';

export function ModuloReportes({ currentUser, solicitudes, cajaFondo, categorias = [] }) {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [successExport, setSuccessExport] = useState('');

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado !== 'TODOS' && s.estado !== filtroEstado) return false;
    if (filtroCategoria !== 'TODAS' && s.categoria !== filtroCategoria) return false;

    if (fechaDesde) {
      const fechaSol = new Date(s.created_at).toISOString().slice(0, 10);
      if (fechaSol < fechaDesde) return false;
    }
    if (fechaHasta) {
      const fechaSol = new Date(s.created_at).toISOString().slice(0, 10);
      if (fechaSol > fechaHasta) return false;
    }
    return true;
  });

  const totalFiltrado = solicitudesFiltradas.reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
  const totalAprobadoFiltrado = solicitudesFiltradas
    .filter(s => s.estado === 'APROBADO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const res = await exportarReporteCompletoZip(solicitudesFiltradas, cajaFondo, currentUser);
      setSuccessExport(`Reporte descargado: ${res.fileName} (${res.totalSustentos} sustentos incluidos)`);
      setTimeout(() => setSuccessExport(''), 6000);
    } catch (err) {
      alert('Error exportando reporte: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDescargarSustentoFila = async (sol) => {
    setDownloadingId(sol.id);
    try {
      await descargarSustentosSolicitud(sol);
    } catch (err) {
      alert('Error descargando sustento: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={22} color="#15803d" />
            <span>Reportes y Liquidación con Sustentos</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Exportación de Excel con datos filtrados + carpeta de comprobantes y sustentos (.zip)
          </p>
        </div>

        <button
          onClick={handleExportZip}
          disabled={isExporting || solicitudesFiltradas.length === 0}
          className="btn btn-excel"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          title="Descarga un ZIP con el Excel de datos filtrados y todos los comprobantes adjuntos"
        >
          {isExporting ? <Download size={16} className="animate-spin" /> : <Archive size={16} />}
          <span>{isExporting ? 'Empaquetando ZIP...' : 'Descargar Excel + Sustentos (.zip)'}</span>
        </button>
      </div>

      {successExport && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.75rem 1rem',
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success-text)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successExport}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
          <Filter size={16} color="#0f172a" />
          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
            Filtros de Reporte
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="APROBADO">Aprobados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Categoría</label>
            <select
              className="form-select"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="TODAS">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            <FileCheck size={20} />
          </div>
          <div>
            <div className="stat-value">{solicitudesFiltradas.length}</div>
            <div className="stat-label">Registros Seleccionados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-value">S/ {totalAprobadoFiltrado.toFixed(2)}</div>
            <div className="stat-label">Total Aprobado</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="stat-value">S/ {totalFiltrado.toFixed(2)}</div>
            <div className="stat-label">Total Bruto Filtrado</div>
          </div>
        </div>
      </div>

      {/* Tabla Previa */}
      <div className="glass-panel" style={{ padding: '0.75rem' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Solicitante</th>
                <th>Categoría</th>
                <th>Comprobante</th>
                <th>RUC Emisor</th>
                <th>Concepto</th>
                <th>Monto S/</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Sustento</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                    {s.codigo}
                  </td>
                  <td>{new Date(s.created_at).toLocaleDateString('es-PE')}</td>
                  <td>{s.solicitante_nombre}</td>
                  <td>{s.categoria.replace(/_/g, ' ')}</td>
                  <td>
                    {(() => {
                      let compText = s.comprobante_tipo ? `${s.comprobante_tipo} ${s.comprobante_numero || ''}` : '-';
                      if (s.rendiciones) {
                        try {
                          let r = typeof s.rendiciones === 'string' ? JSON.parse(s.rendiciones) : s.rendiciones;
                          if (r.length > 0) compText = r.length === 1 ? `${r[0].tipo} ${r[0].numero}` : `${r.length} Comprobantes`;
                        } catch(e) {}
                      }
                      return compText;
                    })()}
                  </td>
                  <td>
                    {(() => {
                      let rucText = s.comprobante_ruc_emisor || '-';
                      if (s.rendiciones) {
                        try {
                          let r = typeof s.rendiciones === 'string' ? JSON.parse(s.rendiciones) : s.rendiciones;
                          if (r.length > 0) rucText = r.length === 1 ? r[0].ruc : 'Varios';
                        } catch(e) {}
                      }
                      return rucText;
                    })()}
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.motivo}
                  </td>
                  <td>
                    <strong style={{ color: '#0f172a' }}>S/ {Number(s.monto).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${
                      s.estado === 'APROBADO' ? 'badge-aprobado' :
                      s.estado === 'RENDIDO' ? 'badge-aprobado' :
                      s.estado === 'POR_RENDIR' ? 'badge-pendiente' :
                      s.estado === 'RECHAZADO' ? 'badge-rechazado' : 'badge-pendiente'
                    }`}>
                      {s.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {(() => {
                      const sustentos = getSustentosDeSolicitud(s);
                      const tieneSustento = sustentos.length > 0;
                      return (
                        <button
                          type="button"
                          onClick={() => handleDescargarSustentoFila(s)}
                          disabled={!tieneSustento || downloadingId === s.id}
                          className={`btn ${tieneSustento ? 'btn-secondary' : 'btn-ghost'}`}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            opacity: tieneSustento ? 1 : 0.4,
                            cursor: tieneSustento ? 'pointer' : 'not-allowed'
                          }}
                          title={
                            !tieneSustento 
                              ? 'Sin sustento adjunto' 
                              : sustentos.length === 1 
                                ? 'Descargar comprobante adjunto' 
                                : `Descargar ${sustentos.length} sustentos (.zip)`
                          }
                        >
                          <FileDown size={14} />
                          <span>
                            {downloadingId === s.id 
                              ? '...' 
                              : tieneSustento 
                                ? (sustentos.length > 1 ? `${sustentos.length} Archivos` : 'Descargar') 
                                : 'Sin archivo'}
                          </span>
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
