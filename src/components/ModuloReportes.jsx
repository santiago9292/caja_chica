import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  FileCheck, 
  CheckCircle2, 
  Layers,
  FileDown,
  Archive,
  ChevronDown,
  Check,
  RotateCcw
} from 'lucide-react';
import { exportarCajaChicaExcel } from '../lib/excelExporter';
import { 
  exportarReporteCompletoZip, 
  descargarSustentosSolicitud, 
  getSustentosDeSolicitud 
} from '../lib/zipExporter';
import { ModalLiquidacion } from './ModalLiquidacion';

const OPCIONES_ESTADO = [
  { value: 'LIQUIDADO', label: 'Liquidado', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  { value: 'RENDIDO', label: 'Rendido (Por Liquidar)', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'POR_RENDIR', label: 'Por Rendir', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'APROBADO', label: 'Aprobado', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'PENDIENTE', label: 'Pendiente', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'POR_REEMBOLSAR', label: 'Por Reembolsar', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'RECHAZADO', label: 'Rechazado', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
];

export function ModuloReportes({ currentUser, solicitudes, cajaFondo, categorias = [], onLiquidarSolicitudes }) {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadosSeleccionados, setEstadosSeleccionados] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [filtroCentroCosto, setFiltroCentroCosto] = useState('TODOS');
  const [dropdownEstadoOpen, setDropdownEstadoOpen] = useState(false);
  const dropdownEstadoRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [successExport, setSuccessExport] = useState('');
  const [isModalLiquidacionOpen, setIsModalLiquidacionOpen] = useState(false);

  const rendidosPorLiquidarCount = solicitudes.filter(s => s.estado === 'RENDIDO').length;

  // Centros de costo disponibles únicos
  const centrosCostoDisponibles = Array.from(
    new Set([
      'TRANS', 'ALM 1', 'ALM 2', 'ALM 3', 'ALM 4', 'LAB', 'REFRI',
      ...categorias.map(c => c.centro_costo).filter(Boolean),
      ...solicitudes.map(s => s.centro_costo).filter(Boolean)
    ])
  );

  // Categorías únicas
  const categoriasNombresUnicos = Array.from(
    new Set([
      'ADMINISTRACIÓN', 'VENTAS', 'PRODUCCION',
      ...categorias.map(c => c.nombre).filter(Boolean),
      ...solicitudes.map(s => s.categoria).filter(Boolean)
    ])
  );

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownEstadoRef.current && !dropdownEstadoRef.current.contains(e.target)) {
        setDropdownEstadoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleEstado = (val) => {
    setEstadosSeleccionados(prev => {
      if (prev.includes(val)) {
        return prev.filter(v => v !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const seleccionarTodos = () => {
    setEstadosSeleccionados(OPCIONES_ESTADO.map(o => o.value));
  };

  const limpiarSeleccion = () => {
    setEstadosSeleccionados([]);
  };

  const contarPorEstado = (estadoVal) => {
    return solicitudes.filter(s => {
      if (estadoVal === 'POR_RENDIR') {
        return s.estado === 'POR_RENDIR' || s.estado === 'PAGADO';
      }
      return s.estado === estadoVal;
    }).length;
  };

  const getLabelEstadoButton = () => {
    if (estadosSeleccionados.length === 0 || estadosSeleccionados.length === OPCIONES_ESTADO.length) {
      return 'Todos';
    }
    if (estadosSeleccionados.length === 1) {
      const op = OPCIONES_ESTADO.find(o => o.value === estadosSeleccionados[0]);
      return op ? op.label : estadosSeleccionados[0];
    }
    if (estadosSeleccionados.length === 2) {
      return estadosSeleccionados
        .map(val => OPCIONES_ESTADO.find(o => o.value === val)?.label || val)
        .join(', ');
    }
    return `${estadosSeleccionados.length} seleccionados`;
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (estadosSeleccionados.length > 0 && estadosSeleccionados.length < OPCIONES_ESTADO.length) {
      const match = estadosSeleccionados.some(est => {
        if (est === 'POR_RENDIR') {
          return s.estado === 'POR_RENDIR' || s.estado === 'PAGADO';
        }
        return s.estado === est;
      });
      if (!match) return false;
    }
    if (filtroCentroCosto !== 'TODOS' && s.centro_costo !== filtroCentroCosto) return false;
    if (filtroCategoria !== 'TODAS') {
      const matchCat = s.categoria === filtroCategoria || 
                       s.categoria_id === filtroCategoria ||
                       (s.categoria && s.categoria.toLowerCase() === filtroCategoria.toLowerCase());
      if (!matchCat) return false;
    }

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

  const getMontoReal = (s) => {
    if (s.rendiciones) {
      try {
        const list = typeof s.rendiciones === 'string' ? JSON.parse(s.rendiciones) : s.rendiciones;
        if (Array.isArray(list) && list.length > 0) {
          const sum = list.reduce((acc, c) => acc + Number(c.monto || 0), 0);
          if (sum > 0) return sum;
        }
      } catch (e) {}
    }
    return Number(s.monto || 0);
  };

  const totalFiltrado = solicitudesFiltradas.reduce((acc, cur) => acc + getMontoReal(cur), 0);
  const totalAprobadoFiltrado = solicitudesFiltradas
    .filter(s => ['APROBADO', 'RENDIDO', 'LIQUIDADO', 'PAGADO', 'POR_RENDIR', 'POR_REEMBOLSAR'].includes(s.estado))
    .reduce((acc, cur) => acc + getMontoReal(cur), 0);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsModalLiquidacionOpen(true)}
            className="btn btn-excel"
            style={{ 
              padding: '0.65rem 1.25rem', 
              fontSize: '0.875rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)'
            }}
            title="Abre la ventana para procesar el corte contable de gastos rendidos"
          >
            <Archive size={17} />
            <span>Liquidación de Gastos Rendidos</span>
            {rendidosPorLiquidarCount > 0 && (
              <span style={{
                background: '#ffffff',
                color: '#15803d',
                borderRadius: '999px',
                padding: '0.1rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}>
                {rendidosPorLiquidarCount} listos
              </span>
            )}
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExporting || solicitudesFiltradas.length === 0}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            title="Descarga un ZIP con los datos filtrados en la tabla actual sin modificar estados"
          >
            {isExporting ? <Download size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span>Exportar Vista Actual</span>
          </button>
        </div>
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

          <div className="form-group" style={{ marginBottom: 0, position: 'relative' }} ref={dropdownEstadoRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Estado</label>
              {estadosSeleccionados.length > 0 && estadosSeleccionados.length < OPCIONES_ESTADO.length && (
                <button
                  type="button"
                  onClick={limpiarSeleccion}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    padding: '0 2px',
                    fontWeight: '600'
                  }}
                  title="Mostrar todos los estados"
                >
                  Restablecer
                </button>
              )}
            </div>

            {/* Botón Disparador del Desplegable */}
            <button
              type="button"
              className="form-select"
              onClick={() => setDropdownEstadoOpen(!dropdownEstadoOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                background: '#ffffff',
                userSelect: 'none',
                padding: '0.65rem 0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  {getLabelEstadoButton()}
                </span>
                {estadosSeleccionados.length > 0 && estadosSeleccionados.length < OPCIONES_ESTADO.length && (
                  <span className="badge badge-admin" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    {estadosSeleccionados.length}
                  </span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                color="#64748b" 
                style={{ 
                  transform: dropdownEstadoOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s', 
                  flexShrink: 0 
                }} 
              />
            </button>

            {/* Menú Desplegable con Checkboxes */}
            {dropdownEstadoOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  minWidth: '240px',
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 100,
                  padding: '0.5rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                {/* Acciones Rápidas */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.2rem 0.35rem 0.45rem 0.35rem',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '0.35rem'
                }}>
                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.73rem',
                      color: '#2563eb',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px'
                    }}
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={limpiarSeleccion}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.73rem',
                      color: '#64748b',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px'
                    }}
                  >
                    Limpiar
                  </button>
                </div>

                {/* Lista de Estados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  {OPCIONES_ESTADO.map(op => {
                    const isChecked = estadosSeleccionados.includes(op.value);
                    const count = contarPorEstado(op.value);
                    return (
                      <label
                        key={op.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: isChecked ? '#f8fafc' : 'transparent',
                          transition: 'background 0.15s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isChecked ? '#f1f5f9' : '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isChecked ? '#f8fafc' : 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEstado(op.value)}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: '#0f172a'
                            }}
                          />
                          <span style={{
                            fontSize: '0.84rem',
                            fontWeight: isChecked ? '600' : '400',
                            color: isChecked ? '#0f172a' : '#334155'
                          }}>
                            {op.label}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '999px',
                          background: op.bg,
                          color: op.color,
                          border: `1px solid ${op.border}`,
                          fontWeight: '700',
                          lineHeight: 1.2
                        }}>
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Centro de Costo</label>
            <select
              className="form-select"
              value={filtroCentroCosto}
              onChange={(e) => setFiltroCentroCosto(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              {centrosCostoDisponibles.map((cc) => (
                <option key={cc} value={cc}>
                  {cc}
                </option>
              ))}
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
              {categoriasNombresUnicos.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
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
        <div className="table-responsive sticky-page-scroll">
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
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {s.categoria ? s.categoria.replace(/_/g, ' ') : '-'}
                    </div>
                    {s.centro_costo && (
                      <div style={{ fontSize: '0.72rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: '700' }}>
                        {s.centro_costo}
                      </div>
                    )}
                  </td>
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
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                      S/ {getMontoReal(s).toFixed(2)}
                    </strong>
                    {s.rendiciones && getMontoReal(s) !== Number(s.monto) && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Adelanto: S/ {Number(s.monto).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      s.estado === 'LIQUIDADO' ? 'badge-liquidado' :
                      s.estado === 'APROBADO' ? 'badge-aprobado' :
                      s.estado === 'RENDIDO' ? 'badge-aprobado' :
                      s.estado === 'POR_RENDIR' ? 'badge-pendiente' :
                      s.estado === 'POR_REEMBOLSAR' ? 'badge-aprobado' :
                      s.estado === 'PENDIENTE_REEMBOLSO' ? 'badge-pendiente' :
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

      {/* Modal de Liquidación Contable de Gastos Rendidos */}
      <ModalLiquidacion
        isOpen={isModalLiquidacionOpen}
        onClose={() => setIsModalLiquidacionOpen(false)}
        solicitudes={solicitudes}
        cajaFondo={cajaFondo}
        currentUser={currentUser}
        onLiquidar={async (data) => {
          if (onLiquidarSolicitudes) {
            await onLiquidarSolicitudes(data);
          }
          setSuccessExport(`Liquidación ${data.codigoLiquidacion} procesada exitosamente. Los gastos pasaron a LIQUIDADO.`);
          setTimeout(() => setSuccessExport(''), 7000);
        }}
      />

    </div>
  );
}
