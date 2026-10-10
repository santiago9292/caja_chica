import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  RotateCcw,
  History,
  Search,
  Eye,
  Calendar,
  UserCheck,
  Receipt,
  X,
  Paperclip,
  FolderArchive
} from 'lucide-react';
import { exportarCajaChicaExcel } from '../lib/excelExporter';
import { 
  exportarReporteCompletoZip, 
  descargarSustentosSolicitud, 
  getSustentosDeSolicitud 
} from '../lib/zipExporter';
import { ModalLiquidacion } from './ModalLiquidacion';
import { getTipoLabel } from './ModalRendicion';

const OPCIONES_ESTADO = [
  { value: 'LIQUIDADO', label: 'Liquidado', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  { value: 'RENDIDO', label: 'Rendido (Por Liquidar)', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'POR_RENDIR', label: 'Por Rendir', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'APROBADO', label: 'Aprobado', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'PENDIENTE', label: 'Pendiente', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'POR_REEMBOLSAR', label: 'Por Reembolsar', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'POR_DEVOLVER', label: 'Por Devolver', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  { value: 'RECHAZADO', label: 'Rechazado', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
];

export function ModuloReportes({ currentUser, solicitudes, cajaFondo, categorias = [], onLiquidarSolicitudes, onRevertirLiquidacion }) {
  // Pestaña activa: 'REPORTES' | 'HISTORIAL_LIQUIDACIONES'
  const [activeTab, setActiveTab] = useState('REPORTES');

  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR') || currentUser?.roles?.includes('SYSADMIN');

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadosSeleccionados, setEstadosSeleccionados] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [filtroCentroCosto, setFiltroCentroCosto] = useState('TODOS');
  const [dropdownEstadoOpen, setDropdownEstadoOpen] = useState(false);
  const dropdownEstadoRef = useRef(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingLiqCodigo, setDownloadingLiqCodigo] = useState(null);
  const [successExport, setSuccessExport] = useState('');
  const [isModalLiquidacionOpen, setIsModalLiquidacionOpen] = useState(false);
  
  // Modal detalle de liquidación pasada
  const [selectedLiquidacionDetalle, setSelectedLiquidacionDetalle] = useState(null);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // Estados para modal de Reversa de Liquidación
  const [liquidacionARevertir, setLiquidacionARevertir] = useState(null);
  const [motivoReversa, setMotivoReversa] = useState('');
  const [isReverting, setIsReverting] = useState(false);
  const [reversaError, setReversaError] = useState('');

  const handleConfirmarReversa = async () => {
    if (!liquidacionARevertir) return;
    setIsReverting(true);
    setReversaError('');
    try {
      if (onRevertirLiquidacion) {
        const res = await onRevertirLiquidacion(liquidacionARevertir.codigo, motivoReversa);
        if (res && res.success === false) {
          setReversaError(res.error || 'Error al revertir la liquidación');
          setIsReverting(false);
          return;
        }
      }
      setSuccessExport(`Liquidación ${liquidacionARevertir.codigo} revertida exitosamente. Los gastos volvieron a estado RENDIDO.`);
      setTimeout(() => setSuccessExport(''), 8000);
      setLiquidacionARevertir(null);
      setMotivoReversa('');
      if (selectedLiquidacionDetalle?.codigo === liquidacionARevertir.codigo) {
        setSelectedLiquidacionDetalle(null);
      }
    } catch (err) {
      setReversaError(err.message || 'Error al revertir la liquidación');
    } finally {
      setIsReverting(false);
    }
  };

  const rendidosPorLiquidarCount = solicitudes.filter(s => s.estado === 'RENDIDO').length;

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

  // Agrupar liquidaciones pasadas por código
  const liquidacionesHistorial = useMemo(() => {
    const map = {};

    solicitudes.forEach(s => {
      if (s.estado === 'LIQUIDADO' || s.liquidacion_codigo) {
        let codigo = s.liquidacion_codigo;
        if (!codigo && s.observaciones_aprobador) {
          const match = s.observaciones_aprobador.match(/\[Liquidado\s+(LIQ-[A-Z0-9_-]+)/i);
          if (match) codigo = match[1];
        }
        if (!codigo) {
          const anio = new Date(s.liquidado_fecha || s.updated_at || s.created_at).getFullYear() || new Date().getFullYear();
          codigo = `LIQ-${anio}-HIST`;
        }

        if (!map[codigo]) {
          map[codigo] = {
            codigo,
            fecha: s.liquidado_fecha || s.updated_at || s.created_at,
            liquidado_por: s.liquidado_por_nombre || s.aprobado_por_nombre || 'Administración',
            liquidado_por_dni: s.liquidado_por_dni || s.aprobado_por_dni || '',
            items: []
          };
        }
        map[codigo].items.push(s);
      }
    });

    return Object.values(map).map(liq => {
      const totalMonto = liq.items.reduce((sum, item) => sum + getMontoReal(item), 0);
      const totalSustentos = liq.items.reduce((sum, item) => sum + getSustentosDeSolicitud(item).length, 0);
      return {
        ...liq,
        totalMonto,
        totalSustentos,
        totalItems: liq.items.length
      };
    }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [solicitudes]);

  // Filtrar historial de liquidaciones por buscador
  const liquidacionesFiltradas = useMemo(() => {
    if (!busquedaHistorial.trim()) return liquidacionesHistorial;
    const q = busquedaHistorial.toLowerCase().trim();
    return liquidacionesHistorial.filter(l => 
      l.codigo.toLowerCase().includes(q) ||
      l.liquidado_por.toLowerCase().includes(q) ||
      l.items.some(i => (i.solicitante_nombre || '').toLowerCase().includes(q) || (i.motivo || '').toLowerCase().includes(q))
    );
  }, [liquidacionesHistorial, busquedaHistorial]);

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

  const totalFiltrado = solicitudesFiltradas.reduce((acc, cur) => acc + getMontoReal(cur), 0);
  const totalAprobadoFiltrado = solicitudesFiltradas
    .filter(s => ['APROBADO', 'RENDIDO', 'LIQUIDADO', 'PAGADO', 'POR_RENDIR', 'POR_REEMBOLSAR', 'POR_DEVOLVER'].includes(s.estado))
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

  const handleDescargarLiquidacionCompleta = async (liq) => {
    setDownloadingLiqCodigo(liq.codigo);
    try {
      const cleanCodigo = liq.codigo.replace(/[^A-Z0-9_-]/g, '_');
      const customPrefix = `Liquidacion_${cleanCodigo}_CORPORACION_CADILLO_Y_ROJO_SAC`;
      const res = await exportarReporteCompletoZip(liq.items, cajaFondo, currentUser, customPrefix);
      setSuccessExport(`Liquidación ${liq.codigo} descargada: ${res.fileName} (${res.totalSustentos} sustentos incluidos)`);
      setTimeout(() => setSuccessExport(''), 6000);
    } catch (err) {
      alert('Error descargando liquidación: ' + (err.message || err));
    } finally {
      setDownloadingLiqCodigo(null);
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
            Exportación de Excel con datos filtrados + descarga de liquidaciones cerradas con sustentos (.zip)
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
            title="Abre la ventana para procesar un nuevo corte contable de gastos rendidos"
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

          {activeTab === 'REPORTES' && (
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
          )}
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('REPORTES')}
          style={{
            background: activeTab === 'REPORTES' ? '#ffffff' : 'transparent',
            color: activeTab === 'REPORTES' ? '#0f172a' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'REPORTES' ? '3px solid #15803d' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: activeTab === 'REPORTES' ? '700' : '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            transition: 'all 0.15s ease'
          }}
        >
          <Filter size={16} color={activeTab === 'REPORTES' ? '#15803d' : '#64748b'} />
          <span>Movimientos y Reportes</span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.1rem 0.45rem' }}>
            {solicitudes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORIAL_LIQUIDACIONES')}
          style={{
            background: activeTab === 'HISTORIAL_LIQUIDACIONES' ? '#ffffff' : 'transparent',
            color: activeTab === 'HISTORIAL_LIQUIDACIONES' ? '#0f172a' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'HISTORIAL_LIQUIDACIONES' ? '3px solid #15803d' : '3px solid transparent',
            padding: '0.65rem 1.25rem',
            fontWeight: activeTab === 'HISTORIAL_LIQUIDACIONES' ? '700' : '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            transition: 'all 0.15s ease'
          }}
        >
          <FolderArchive size={16} color={activeTab === 'HISTORIAL_LIQUIDACIONES' ? '#15803d' : '#64748b'} />
          <span>Historial de Liquidaciones Pasadas</span>
          {liquidacionesHistorial.length > 0 && (
            <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', padding: '0.1rem 0.45rem', fontWeight: '800', border: '1px solid #86efac' }}>
              {liquidacionesHistorial.length} lotes
            </span>
          )}
        </button>
      </div>

      {successExport && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.85rem 1.25rem',
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

      {/* VISTA 1: MOVIMIENTOS Y REPORTES GENERALES */}
      {activeTab === 'REPORTES' && (
        <>
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
                              if (r.length > 0) compText = r.length === 1 ? `${getTipoLabel(r[0].tipo)} ${r[0].numero || ''}` : `${r.length} Comprobantes`;
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
                              if (r.length > 0) rucText = r.length === 1 ? (r[0].ruc || '-') : 'Varios';
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
        </>
      )}

      {/* VISTA 2: HISTORIAL DE LIQUIDACIONES PASADAS */}
      {activeTab === 'HISTORIAL_LIQUIDACIONES' && (
        <div>
          {/* Métricas del Historial */}
          <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
                <FolderArchive size={20} />
              </div>
              <div>
                <div className="stat-value">{liquidacionesHistorial.length}</div>
                <div className="stat-label">Lotes Oficiales Liquidados</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <FileCheck size={20} />
              </div>
              <div>
                <div className="stat-value">
                  {liquidacionesHistorial.reduce((sum, l) => sum + l.totalItems, 0)}
                </div>
                <div className="stat-label">Gastos Archivados</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="stat-value">
                  S/ {liquidacionesHistorial.reduce((sum, l) => sum + l.totalMonto, 0).toFixed(2)}
                </div>
                <div className="stat-label">Total Histórico Liquidado</div>
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda del Historial */}
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por código (ej: LIQ-2026-001), administrador, colaborador o motivo..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            {busquedaHistorial && (
              <button 
                type="button" 
                onClick={() => setBusquedaHistorial('')} 
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {/* Lista de Liquidaciones Pasadas */}
          {liquidacionesFiltradas.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderArchive size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.6 }} />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                {liquidacionesHistorial.length === 0 
                  ? 'No hay liquidaciones pasadas registradas' 
                  : 'No se encontraron liquidaciones con los términos buscados'}
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                {liquidacionesHistorial.length === 0 
                  ? 'Cuando ejecutes un corte contable con el botón "Liquidación de Gastos Rendidos", los lotes se archivarán aquí automáticamente para que puedas volver a descargar su Excel y carpeta de sustentos cuando lo requieras.' 
                  : 'Intenta buscar por otro código correlativo o nombre de responsable.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {liquidacionesFiltradas.map((liq) => {
                const isDownloading = downloadingLiqCodigo === liq.codigo;
                return (
                  <div 
                    key={liq.codigo} 
                    className="glass-panel"
                    style={{ 
                      padding: '1.25rem 1.5rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '1rem',
                      borderLeft: '4px solid #15803d',
                      background: '#ffffff',
                      transition: 'box-shadow 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        background: '#dcfce7',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #86efac'
                      }}>
                        <Archive size={22} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>
                            {liq.codigo}
                          </span>
                          <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.72rem', fontWeight: '700' }}>
                            OFICIAL CERRADO
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={13} color="#94a3b8" />
                            {new Date(liq.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <UserCheck size={13} color="#94a3b8" />
                            {liq.liquidado_por}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de totales */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                          Total Gastos ({liq.totalItems})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: '600' }}>
                          📎 {liq.totalSustentos} Sustentos
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '110px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                          Importe Liquidado
                        </div>
                        <div style={{ fontSize: '1.15rem', color: '#15803d', fontWeight: '800' }}>
                          S/ {liq.totalMonto.toFixed(2)}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLiquidacionDetalle(liq)}
                          className="btn btn-secondary"
                          style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Ver detalle de comprobantes y solicitudes de esta liquidación"
                        >
                          <Eye size={15} />
                          <span>Ver Detalle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDescargarLiquidacionCompleta(liq)}
                          disabled={isDownloading}
                          className="btn btn-excel"
                          style={{ 
                            padding: '0.55rem 1rem', 
                            fontSize: '0.825rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.45rem',
                            fontWeight: '700'
                          }}
                          title="Descargar archivo ZIP con el libro Excel y la carpeta de sustentos"
                        >
                          {isDownloading ? (
                            <>
                              <Download size={15} className="animate-spin" />
                              <span>Empaquetando...</span>
                            </>
                          ) : (
                            <>
                              <Download size={15} />
                              <span>Descargar ZIP (Excel + Sustentos)</span>
                            </>
                          )}
                        </button>

                        {/* Botón de Reversa exclusivo para Administrador / Sysadmin */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setMotivoReversa('');
                              setReversaError('');
                              setLiquidacionARevertir(liq);
                            }}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '0.55rem 0.85rem', 
                              fontSize: '0.8rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.35rem',
                              color: '#b91c1c',
                              borderColor: '#fca5a5',
                              background: '#fff5f5'
                            }}
                            title="Revertir este lote contable para agrupar nuevamente los gastos"
                          >
                            <RotateCcw size={14} />
                            <span>Revertir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle de Liquidación Pasada */}
      {selectedLiquidacionDetalle && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '880px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Archive size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
                    Liquidación Oficial: <strong>{selectedLiquidacionDetalle.codigo}</strong>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                    Fecha: {new Date(selectedLiquidacionDetalle.fecha).toLocaleString('es-PE')} | Responsable: {selectedLiquidacionDetalle.liquidado_por}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedLiquidacionDetalle(null)} 
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumen dentro del modal */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '0.75rem', 
              background: '#f8fafc', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #e2e8f0',
              marginBottom: '1rem' 
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Liquidado</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803d' }}>
                  S/ {selectedLiquidacionDetalle.totalMonto.toFixed(2)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Gastos Rendidos</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                  {selectedLiquidacionDetalle.totalItems} solicitudes
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Sustentos Adjuntos</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563eb' }}>
                  {selectedLiquidacionDetalle.totalSustentos} archivos
                </div>
              </div>
            </div>

            {/* Tabla de Gastos de la Liquidación */}
            <div className="table-responsive" style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
              <table className="data-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Solicitante</th>
                    <th>Categoría</th>
                    <th>Comprobante / RUC</th>
                    <th>Concepto</th>
                    <th>Monto S/</th>
                    <th style={{ textAlign: 'center' }}>Sustento</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLiquidacionDetalle.items.map((s) => {
                    const sustentos = getSustentosDeSolicitud(s);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{s.codigo}</td>
                        <td>{s.solicitante_nombre}</td>
                        <td>{s.categoria ? s.categoria.replace(/_/g, ' ') : '-'}</td>
                        <td>
                          {(() => {
                            if (s.rendiciones) {
                              try {
                                const r = typeof s.rendiciones === 'string' ? JSON.parse(s.rendiciones) : s.rendiciones;
                                if (r.length > 0) {
                                  return (
                                    <div>
                                      <strong>{getTipoLabel(r[0].tipo)}</strong>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {r[0].numero ? `${r[0].numero} | ` : ''}{r[0].ruc ? `RUC: ${r[0].ruc}` : ''}
                                      </div>
                                    </div>
                                  );
                                }
                              } catch(e) {}
                            }
                            return s.comprobante_tipo ? `${s.comprobante_tipo} ${s.comprobante_numero || ''}` : '-';
                          })()}
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.motivo}
                        </td>
                        <td>
                          <strong>S/ {getMontoReal(s).toFixed(2)}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {sustentos.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleDescargarSustentoFila(s)}
                              disabled={downloadingId === s.id}
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Descargar sustento individual"
                            >
                              <FileDown size={12} />
                              <span>{downloadingId === s.id ? '...' : sustentos.length > 1 ? `${sustentos.length} docs` : 'Descargar'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Modal Detalle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedLiquidacionDetalle(null)} 
                  className="btn btn-secondary"
                >
                  Cerrar
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMotivoReversa('');
                      setReversaError('');
                      setLiquidacionARevertir(selectedLiquidacionDetalle);
                    }}
                    className="btn btn-secondary"
                    style={{ 
                      color: '#b91c1c', 
                      borderColor: '#fca5a5', 
                      background: '#fff5f5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title="Revertir este lote contable"
                  >
                    <RotateCcw size={14} />
                    <span>Revertir Lote</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDescargarLiquidacionCompleta(selectedLiquidacionDetalle)}
                disabled={downloadingLiqCodigo === selectedLiquidacionDetalle.codigo}
                className="btn btn-excel"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '700' }}
              >
                {downloadingLiqCodigo === selectedLiquidacionDetalle.codigo ? (
                  <>
                    <Download size={16} className="animate-spin" />
                    <span>Descargando ZIP Oficial...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Descargar ZIP Completo (Excel + Sustentos)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL DE CONFIRMACIÓN DE REVERSA DE LIQUIDACIÓN */}
      {liquidacionARevertir && (
        <div className="modal-overlay" onClick={() => !isReverting && setLiquidacionARevertir(null)}>
          <div 
            className="modal-content glass-panel" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '520px', width: '92%', padding: '1.75rem', borderRadius: '16px', border: '1.5px solid #fee2e2' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <RotateCcw size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.25rem 0', fontWeight: '800' }}>
                  ¿Revertir Liquidación {liquidacionARevertir.codigo}?
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.825rem', margin: 0 }}>
                  Acción autorizada para Administrador / Sysadmin
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isReverting && setLiquidacionARevertir(null)}
                className="btn-close"
                disabled={isReverting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumen del Lote a Revertir */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Lote contable:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{liquidacionARevertir.codigo}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Gastos afectados:</span>
                <strong>{liquidacionARevertir.totalItems} solicitud(es) ({liquidacionARevertir.totalSustentos} sustentos)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Importe liquidado:</span>
                <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>S/ {liquidacionARevertir.totalMonto.toFixed(2)}</strong>
              </div>
            </div>

            {/* Mensaje explicativo */}
            <div style={{ 
              background: '#fffbeb', 
              border: '1px solid #fde68a', 
              borderRadius: '8px', 
              padding: '0.85rem', 
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: '#92400e',
              lineHeight: 1.4
            }}>
              <strong>¿Qué ocurrirá al revertir?</strong>
              <ul style={{ margin: '0.4rem 0 0 1.1rem', padding: 0 }}>
                <li>Los gastos volverán al estado <strong>RENDIDO</strong>.</li>
                <li>Volverán a aparecer disponibles en <em>"Liquidación de Gastos Rendidos"</em> para que puedas agruparlos nuevamente con otros gastos en un solo lote.</li>
                <li><strong>No se altera el saldo en efectivo de la caja</strong> ni se borran comprobantes ni sustentos cargados.</li>
              </ul>
            </div>

            {/* Motivo Opcional */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                Motivo de la reversa (opcional para auditoría):
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Se liquidó separado por error, agrupar en lote único..."
                value={motivoReversa}
                onChange={(e) => setMotivoReversa(e.target.value)}
                disabled={isReverting}
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {reversaError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.65rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
                {reversaError}
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setLiquidacionARevertir(null)}
                disabled={isReverting}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.1rem', fontSize: '0.825rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarReversa}
                disabled={isReverting}
                className="btn"
                style={{ 
                  background: '#dc2626', 
                  color: '#ffffff', 
                  padding: '0.6rem 1.25rem', 
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: isReverting ? 'not-allowed' : 'pointer'
                }}
              >
                {isReverting ? (
                  <>
                    <RotateCcw size={15} className="animate-spin" />
                    <span>Revirtiendo...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={15} />
                    <span>Confirmar Reversa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

