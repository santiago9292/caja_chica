import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  FileCheck, 
  CheckCircle2, 
  Server,
  Layers
} from 'lucide-react';
import { exportarCajaChicaExcel } from '../lib/excelExporter';

export function ModuloReportes({ currentUser, solicitudes, cajaFondo }) {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [isExporting, setIsExporting] = useState(false);
  const [successExport, setSuccessExport] = useState('');

  // Filtrado reactivo de datos
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

  // Exportación directa en cliente mediante SheetJS
  const handleExportClientExcel = async () => {
    setIsExporting(true);
    try {
      const res = exportarCajaChicaExcel(solicitudesFiltradas, cajaFondo, currentUser);
      setSuccessExport(`Reporte generado con éxito: ${res.fileName}`);
      setTimeout(() => setSuccessExport(''), 5000);
    } catch (err) {
      alert('Error exportando Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Exportación a través del endpoint de servidor Node.js
  const handleExportServerExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: solicitudesFiltradas,
          title: 'Reporte Oficial de Caja Chica',
          empresa: 'EMPRESA CORPORATIVA S.A.C.'
        })
      });

      if (!response.ok) throw new Error('Error en el servidor al generar reporte');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Caja_Chica_Servidor_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccessExport('Reporte generado exitosamente desde el servidor Node.js.');
      setTimeout(() => setSuccessExport(''), 5000);
    } catch (err) {
      console.warn('Fallback a exportador cliente:', err);
      // Fallback automático al generador de cliente
      handleExportClientExcel();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      
      {/* Encabezado de Reportes */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={26} color="#10b981" />
            <span>Generador de Reportes y Liquidación en Excel</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Exportación formal multi-hoja con desglose de comprobantes, categorías y solicitantes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={handleExportClientExcel}
            disabled={isExporting || solicitudesFiltradas.length === 0}
            className="btn btn-excel"
            style={{ padding: '0.75rem 1.4rem', fontSize: '0.925rem' }}
          >
            <Download size={18} />
            <span>{isExporting ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {successExport && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem',
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-md)',
          color: '#34d399',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{successExport}</span>
        </div>
      )}

      {/* Filtros de Reporte */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={18} color="var(--primary-light)" />
          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
            Filtros para el Reporte
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fecha Desde</label>
            <input
              type="date"
              className="form-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fecha Hasta</label>
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
              <option value="TODOS">Todos los Estados</option>
              <option value="APROBADO">Solo Aprobados</option>
              <option value="PENDIENTE">Solo Pendientes</option>
              <option value="RECHAZADO">Solo Rechazados</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Categoría</label>
            <select
              className="form-select"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="TODAS">Todas las Categorías</option>
              <option value="TRANSPORTE">Transporte / Movilidad</option>
              <option value="ALIMENTACION">Alimentación / Refrigerios</option>
              <option value="MATERIALES_OFICINA">Materiales de Oficina</option>
              <option value="SERVICIOS_URGENTES">Servicios Urgentes</option>
              <option value="REPRESENTACION">Gastos de Representación</option>
              <option value="OTROS">Otros Gastos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumen del Reporte Filtrado */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{solicitudesFiltradas.length}</div>
            <div className="stat-label">Registros Incluidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">S/ {totalAprobadoFiltrado.toFixed(2)}</div>
            <div className="stat-label">Total Aprobado para Rendición</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">S/ {totalFiltrado.toFixed(2)}</div>
            <div className="stat-label">Total Bruto Filtrado</div>
          </div>
        </div>
      </div>

      {/* Vista Previa de la Data a Exportar */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div style={{ padding: '0.5rem 0.5rem 1rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
            Vista Previa de Movimientos a Exportar
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            El archivo Excel incluirá: Hoja de Arqueo, Libro de Movimientos, Resumen por Categoría y Resumen por Solicitante.
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Solicitante</th>
                <th>Categoría</th>
                <th>Comprobante</th>
                <th>RUC / Emisor</th>
                <th>Concepto</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary-light)' }}>
                    {s.codigo}
                  </td>
                  <td>{new Date(s.created_at).toLocaleDateString('es-PE')}</td>
                  <td>{s.solicitante_nombre}</td>
                  <td>{s.categoria.replace(/_/g, ' ')}</td>
                  <td>{s.comprobante_tipo ? `${s.comprobante_tipo} ${s.comprobante_numero || ''}` : '-'}</td>
                  <td>{s.comprobante_ruc_emisor || '-'}</td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.motivo}
                  </td>
                  <td>
                    <strong style={{ color: '#fff' }}>S/ {Number(s.monto).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${
                      s.estado === 'APROBADO' ? 'badge-aprobado' :
                      s.estado === 'RECHAZADO' ? 'badge-rechazado' : 'badge-pendiente'
                    }`}>
                      {s.estado}
                    </span>
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
