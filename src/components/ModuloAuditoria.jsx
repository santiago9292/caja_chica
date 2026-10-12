import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  FileText,
  User,
  Clock,
  RefreshCw,
  Eye,
  X,
  Layers,
  ArrowRight,
  Receipt,
  DollarSign,
  FileCheck,
  RotateCcw,
  Building,
  FolderArchive,
  Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { store } from '../lib/store';

export function ModuloAuditoria({ currentUser, solicitudes = [], auditLogs = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedSol, setSelectedSol] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [lastPingTime, setLastPingTime] = useState(() => store.getLastKeepAlivePing());

  const handlePingKeepAlive = async () => {
    setPingLoading(true);
    try {
      const res = await store.pingSupabaseKeepAlive();
      if (res.success) {
        setLastPingTime(res.timestamp);
        alert('✅ ¡Ping de Keep-Alive exitoso a Supabase!\nSe registró actividad en la base de datos para prevenir la pausa de inactividad.');
      } else {
        alert(`⚠️ Aviso Keep-Alive: ${res.error || res.reason}`);
      }
    } finally {
      setPingLoading(false);
    }
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(sol => {
      // 1. Filtro por estado
      if (filtroEstado !== 'TODOS') {
        if (filtroEstado === 'PENDIENTE' && !(sol.estado === 'PENDIENTE' || sol.estado === 'PENDIENTE_REEMBOLSO')) return false;
        if (filtroEstado === 'APROBADO' && !(sol.estado === 'APROBADO' || sol.estado === 'POR_REEMBOLSAR')) return false;
        if (filtroEstado === 'POR_RENDIR' && sol.estado !== 'POR_RENDIR') return false;
        if (filtroEstado === 'RENDIDO' && sol.estado !== 'RENDIDO') return false;
        if (filtroEstado === 'LIQUIDADO' && sol.estado !== 'LIQUIDADO') return false;
        if (filtroEstado === 'RECHAZADO' && sol.estado !== 'RECHAZADO') return false;
      }

      // 2. Filtro por fechas de registro
      if (fechaDesde && sol.created_at) {
        const solDate = new Date(sol.created_at).setHours(0, 0, 0, 0);
        const fDesde = new Date(fechaDesde + 'T00:00:00').getTime();
        if (solDate < fDesde) return false;
      }
      if (fechaHasta && sol.created_at) {
        const solDate = new Date(sol.created_at).setHours(23, 59, 59, 999);
        const fHasta = new Date(fechaHasta + 'T23:59:59').getTime();
        if (solDate > fHasta) return false;
      }

      // 3. Búsqueda por texto (código, solicitante, DNI, motivo, aprobador, cajero)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const codigo = (sol.codigo || '').toLowerCase();
        const solicitante = (sol.solicitante_nombre || '').toLowerCase();
        const dni = (sol.solicitante_dni || '').toLowerCase();
        const motivo = (sol.motivo || '').toLowerCase();
        const aprobador = (sol.aprobado_por_nombre || '').toLowerCase();
        const cajero = (sol.pagado_por_nombre || '').toLowerCase();
        const liqCodigo = (sol.liquidacion_codigo || '').toLowerCase();

        return (
          codigo.includes(q) ||
          solicitante.includes(q) ||
          dni.includes(q) ||
          motivo.includes(q) ||
          aprobador.includes(q) ||
          cajero.includes(q) ||
          liqCodigo.includes(q)
        );
      }

      return true;
    });
  }, [solicitudes, filtroEstado, fechaDesde, fechaHasta, searchTerm]);

  // KPIs
  const totalCount = solicitudes.length;
  const countAprobadas = solicitudes.filter(s => ['APROBADO', 'POR_RENDIR', 'POR_REEMBOLSAR', 'POR_DEVOLVER', 'RENDIDO', 'LIQUIDADO'].includes(s.estado)).length;
  const countRendidas = solicitudes.filter(s => ['RENDIDO', 'LIQUIDADO'].includes(s.estado)).length;
  const countPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_REEMBOLSO').length;

  // Constructor de Timeline para una solicitud seleccionada
  const buildTimelineForSolicitud = (sol) => {
    if (!sol) return [];
    const timeline = [];

    // Base time: Creación de la solicitud
    const tCreacion = sol.created_at ? new Date(sol.created_at).getTime() : Date.now();
    const fechaCreacion = new Date(tCreacion).toISOString();

    // Hito 1: Registro de la Solicitud (Siempre primer paso)
    timeline.push({
      id: `crea-${sol.id}`,
      orden: 1,
      titulo: '1. Solicitud Registrada',
      subtitulo: sol.tipo === 'ADELANTO_DINERO' ? 'Solicitud de Adelanto en Efectivo' : 'Rendición Directa con Comprobante',
      fecha: fechaCreacion,
      usuario: sol.solicitante_nombre,
      dni: sol.solicitante_dni,
      rol: 'Solicitante',
      tipo: 'INFO',
      icono: FileText,
      detalles: [
        { etiqueta: 'Monto Solicitado', valor: `S/ ${Number(sol.monto || 0).toFixed(2)}` },
        { etiqueta: 'Categoría', valor: sol.categoria?.replace(/_/g, ' ') },
        { etiqueta: 'Centro de Costo', valor: sol.centro_costo || 'CC-GENERAL' },
        { etiqueta: 'Justificación / Motivo', valor: sol.motivo }
      ]
    });

    // Hito 2: Aprobación o Rechazo (Siempre segundo paso, posterior a la creación)
    let tAprobacion = tCreacion + (10 * 60 * 1000); // default +10 min
    if (sol.aprobado_fecha) {
      const parsedAprob = new Date(sol.aprobado_fecha).getTime();
      tAprobacion = !isNaN(parsedAprob) && parsedAprob >= tCreacion ? parsedAprob : tCreacion + (5 * 60 * 1000);
    }
    const fechaAprobacion = new Date(tAprobacion).toISOString();

    if (sol.aprobado_fecha || sol.aprobado_por_nombre || sol.estado === 'RECHAZADO' || ['APROBADO', 'POR_RENDIR', 'POR_DEVOLVER', 'RENDIDO', 'LIQUIDADO'].includes(sol.estado)) {
      const isRechazado = sol.estado === 'RECHAZADO';
      
      let obsAprob = sol.observaciones_aprobador || 'Conforme sin observaciones adicionales';
      obsAprob = obsAprob
        .replace(/\[Liquidado[^\]]*\]/gi, '')
        .replace(/\[Liquidación[^\]]*\]/gi, '')
        .replace(/\[Abono:[^\]]*\]/gi, '')
        .replace(/\[Devolución[^\]]*\]/gi, '')
        .trim()
        .replace(/^\|\s*|\s*\|$/g, '');

      timeline.push({
        id: `aprob-${sol.id}`,
        orden: 2,
        titulo: isRechazado ? '2. Solicitud Rechazada' : '2. Aprobación Concedida',
        subtitulo: isRechazado ? 'Evaluación denegada por Administrador' : 'Evaluación técnica y presupuestal aprobada',
        fecha: fechaAprobacion,
        usuario: sol.aprobado_por_nombre || 'Claudia Cadillo',
        dni: sol.aprobado_por_dni || '46212908',
        rol: 'Administrador Aprobador',
        tipo: isRechazado ? 'DANGER' : 'SUCCESS',
        icono: isRechazado ? XCircle : CheckCircle2,
        detalles: [
          { etiqueta: 'Resultado', valor: isRechazado ? 'RECHAZADO' : 'APROBADO' },
          { etiqueta: 'Observaciones / Motivo', valor: obsAprob || 'Aprobado conforme' }
        ]
      });
    }

    // Hito 3: Abono / Entrega de Efectivo en Ventanilla (Siempre tercer paso, posterior a la aprobación)
    let tAbono = tAprobacion + (5 * 60 * 1000); // default +5 min post aprobación
    if (sol.pagado_fecha) {
      const parsedPago = new Date(sol.pagado_fecha).getTime();
      tAbono = !isNaN(parsedPago) && parsedPago >= tAprobacion ? parsedPago : tAprobacion + (5 * 60 * 1000);
    }
    const fechaAbono = new Date(tAbono).toISOString();

    if (sol.pagado_fecha || sol.pagado_por_nombre || ['POR_RENDIR', 'POR_DEVOLVER', 'RENDIDO', 'LIQUIDADO'].includes(sol.estado)) {
      timeline.push({
        id: `abono-${sol.id}`,
        orden: 3,
        titulo: '3. Entrega de Efectivo (Abono)',
        subtitulo: 'Desembolso realizado desde Caja Chica',
        fecha: fechaAbono,
        usuario: sol.pagado_por_nombre || 'Andrea Parco Velarde',
        dni: sol.pagado_por_dni || '72544319',
        rol: 'Cajero / Ventanilla',
        tipo: 'SUCCESS',
        icono: DollarSign,
        detalles: [
          { etiqueta: 'Monto Entregado', valor: `S/ ${Number(sol.monto || 0).toFixed(2)}` },
          { etiqueta: 'Modalidad de Pago', valor: sol.abono_metodo || 'Efectivo en Ventanilla / Caja' },
          { etiqueta: 'N° de Operación / Recibo', valor: sol.abono_operacion || 'Directo en ventanilla' },
          { etiqueta: 'Sustento Adjunto', valor: sol.abono_sustento_nombre ? `${sol.abono_sustento_nombre}` : 'Recibo físico firmado' }
        ],
        adjuntoUrl: sol.abono_sustento_url
      });
    }

    // Hito 4: Rendición de Comprobantes (Siempre cuarto paso, posterior a la entrega de efectivo)
    let tRendicion = tAbono + (2 * 60 * 60 * 1000); // default +2 horas post abono
    if (sol.rendicion_fecha) {
      const parsedRend = new Date(sol.rendicion_fecha).getTime();
      if (!isNaN(parsedRend) && parsedRend >= tAbono) {
        tRendicion = parsedRend;
      }
    }
    const fechaRendicion = new Date(tRendicion).toISOString();

    if (sol.rendiciones) {
      let lista = [];
      try {
        lista = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
      } catch (e) {}
      if (Array.isArray(lista) && lista.length > 0) {
        const totalRendido = lista.reduce((sum, c) => sum + Number(c.monto || 0), 0);
        const adelanto = Number(sol.monto || 0);
        const diferencia = Number((totalRendido - adelanto).toFixed(2));

        let estadoRendicion = 'Exacto (Gasto igual al adelanto)';
        if (diferencia > 0) estadoRendicion = `Exceso a favor del solicitante (+ S/ ${diferencia.toFixed(2)})`;
        if (diferencia < 0) estadoRendicion = `Sobrante devuelto a caja (- S/ ${Math.abs(diferencia).toFixed(2)})`;

        timeline.push({
          id: `rend-${sol.id}`,
          orden: 4,
          titulo: '4. Rendición y Sustento de Comprobantes',
          subtitulo: `${lista.length} comprobante(s) sustentado(s)`,
          fecha: fechaRendicion,
          usuario: sol.solicitante_nombre,
          dni: sol.solicitante_dni,
          rol: 'Solicitante',
          tipo: 'SUCCESS',
          icono: Receipt,
          detalles: [
            { etiqueta: 'Total Comprobantes', valor: `${lista.length} documento(s)` },
            { etiqueta: 'Total Sustentado', valor: `S/ ${totalRendido.toFixed(2)}` },
            { etiqueta: 'Balance de Rendición', valor: estadoRendicion }
          ],
          comprobantes: lista
        });
      }
    }

    // Hito 5: Reversión de Liquidación (si ocurrió históricamente)
    if (sol.observaciones_aprobador && sol.observaciones_aprobador.includes('revertida')) {
      const matchReversa = sol.observaciones_aprobador.match(/\[Liquidación\s+([^\s]+)\s+revertida\s+el\s+([^\s]+)\s+por\s+([^:\]]+)(?::\s*([^\]]*))?\]/i);
      if (matchReversa) {
        const tReversa = tRendicion + (3 * 60 * 60 * 1000);
        timeline.push({
          id: `revers-${sol.id}`,
          orden: 5,
          titulo: '5. Reversión de Liquidación Contable',
          subtitulo: `Lote ${matchReversa[1]} reabierto`,
          fecha: new Date(tReversa).toISOString(),
          usuario: matchReversa[3]?.trim() || 'Santiago Pazos',
          rol: 'Administrador / Auditor',
          tipo: 'WARNING',
          icono: RotateCcw,
          detalles: [
            { etiqueta: 'Lote Revertido', valor: matchReversa[1] },
            { etiqueta: 'Motivo de Reversión', valor: matchReversa[4]?.trim() || 'Reapertura para reajuste de comprobantes' },
            { etiqueta: 'Estado Posterior', valor: 'Revertido a estado RENDIDO' }
          ]
        });
      }
    }

    // Hito 6: Liquidación en Lote Contable (si actualmente está LIQUIDADO)
    if (sol.estado === 'LIQUIDADO' || sol.liquidacion_codigo) {
      let tLiq = tRendicion + (4 * 60 * 60 * 1000);
      if (sol.liquidado_fecha) {
        const parsedLiq = new Date(sol.liquidado_fecha).getTime();
        if (!isNaN(parsedLiq) && parsedLiq >= tRendicion) {
          tLiq = parsedLiq;
        }
      }

      timeline.push({
        id: `liq-${sol.id}`,
        orden: 6,
        titulo: '5. Liquidación Contable Cerrada',
        subtitulo: `Empaquetado en lote ${sol.liquidacion_codigo || 'LIQ'}`,
        fecha: new Date(tLiq).toISOString(),
        usuario: sol.liquidado_por_nombre || 'Andrea Parco Velarde',
        dni: sol.liquidado_por_dni || '72544319',
        rol: 'Contabilidad / Administración',
        tipo: 'INFO',
        icono: FolderArchive,
        detalles: [
          { etiqueta: 'Código de Lote', valor: sol.liquidacion_codigo || 'LIQ-2026-00X' },
          { etiqueta: 'Fecha de Cierre', valor: sol.liquidado_fecha ? new Date(sol.liquidado_fecha).toLocaleDateString('es-PE') : 'Procesado' },
          { etiqueta: 'Estado Contable', valor: 'LIQUIDADO (Archivado con comprobantes)' }
        ]
      });
    }

    // Ordenar estrictamente por el orden lógico secuencial (1 -> 2 -> 3 -> 4 -> 5 -> 6)
    return timeline.sort((a, b) => a.orden - b.orden);
  };

  // Exportar solicitudes y su trazabilidad a Excel
  const handleExportExcel = () => {
    if (solicitudesFiltradas.length === 0) {
      alert('No hay solicitudes filtradas para exportar.');
      return;
    }

    const dataToExport = solicitudesFiltradas.map(s => {
      return {
        'Código': s.codigo,
        'Fecha Registro': new Date(s.created_at).toLocaleString('es-PE'),
        'Solicitante': s.solicitante_nombre,
        'DNI': s.solicitante_dni,
        'Categoría': s.categoria,
        'Centro Costo': s.centro_costo || '-',
        'Motivo / Justificación': s.motivo,
        'Monto': Number(s.monto || 0).toFixed(2),
        'Estado Actual': s.estado,
        'Aprobado Por': s.aprobado_por_nombre || '-',
        'Aprobado Fecha': s.aprobado_fecha ? new Date(s.aprobado_fecha).toLocaleString('es-PE') : '-',
        'Pagado / Abonado Por': s.pagado_por_nombre || '-',
        'Lote Liquidación': s.liquidacion_codigo || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trazabilidad_Solicitudes');

    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 35 },
      { wch: 12 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 }
    ];

    const fileName = `Trazabilidad_CajaChica_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'APROBADO':
        return <span className="badge badge-aprobado">APROBADO</span>;
      case 'RENDIDO':
        return <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: '800' }}>RENDIDO</span>;
      case 'LIQUIDADO':
        return <span className="badge badge-liquidado">LIQUIDADO</span>;
      case 'POR_RENDIR':
        return <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>POR RENDIR</span>;
      case 'POR_REEMBOLSAR':
        return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>POR REEMBOLSAR</span>;
      case 'PENDIENTE_REEMBOLSO':
        return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>REEMBOLSO PENDIENTE</span>;
      case 'POR_DEVOLVER':
        return <span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>POR DEVOLVER</span>;
      case 'RECHAZADO':
        return <span className="badge badge-rechazado">RECHAZADO</span>;
      case 'PENDIENTE':
      default:
        return <span className="badge badge-pendiente">{estado ? estado.replace(/_/g, ' ') : 'PENDIENTE'}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Encabezado y Métricas */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={24} color="#0284c7" />
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                Auditoría & Trazabilidad de Solicitudes
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Listado consolidado de solicitudes. Pulsa en <strong>Ficha</strong> para ver la línea de tiempo completa con usuarios, fechas y horas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={handlePingKeepAlive} 
              disabled={pingLoading}
              className="btn btn-secondary" 
              title={lastPingTime ? `Último ping registrado: ${new Date(lastPingTime).toLocaleString('es-PE')}` : 'Enviar ping liviano para prevenir pausa por inactividad de 7 días en Supabase'}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
              <Activity size={13} />
              <span>{pingLoading ? 'Pinging...' : 'Keep-Alive Supabase'}</span>
            </button>
            {onRefresh && (
              <button onClick={onRefresh} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
                <RefreshCw size={14} />
                <span>Actualizar</span>
              </button>
            )}
            <button onClick={handleExportExcel} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
              <Download size={14} />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total de Solicitudes</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>{totalCount}</span>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Aprobadas & En Curso</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0284c7' }}>{countAprobadas}</span>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Rendidas & Liquidadas</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#16a34a' }}>{countRendidas}</span>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Pendientes de Aprobación</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b45309' }}>{countPendientes}</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
          
          {/* Buscador */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={15} color="var(--text-faint)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por código (SOL-...), solicitante, DNI, aprobador o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
            />
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem' }}
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADO">Aprobados</option>
              <option value="POR_RENDIR">Por Rendir (Entregados)</option>
              <option value="RENDIDO">Rendidos</option>
              <option value="LIQUIDADO">Liquidados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem' }}
              title="Fecha Registro Desde"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem' }}
              title="Fecha Registro Hasta"
            />
          </div>

        </div>

        {/* Resumen de filtro activo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>
            Mostrando <strong>{solicitudesFiltradas.length}</strong> de {totalCount} solicitudes registradas
          </span>
          {(searchTerm || filtroEstado !== 'TODOS' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroEstado('TODOS');
                setFechaDesde('');
                setFechaHasta('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontWeight: '600',
                padding: 0
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="glass-panel" style={{ padding: '0.75rem', overflowX: 'auto' }}>
        {solicitudesFiltradas.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <FileText size={36} color="var(--text-faint)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ color: '#0f172a', margin: 0, fontSize: '1rem' }}>No se encontraron solicitudes</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Intenta cambiar los términos de búsqueda o filtros.
            </p>
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '820px' }}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Código</th>
                <th style={{ whiteSpace: 'nowrap' }}>Fecha Registro</th>
                <th>Solicitante</th>
                <th>Concepto / Categoría</th>
                <th style={{ whiteSpace: 'nowrap' }}>Monto</th>
                <th style={{ whiteSpace: 'nowrap' }}>Estado Actual</th>
                <th>Última Intervención</th>
                <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Trazabilidad</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((sol) => {
                const dateObj = new Date(sol.created_at);
                const fechaStr = dateObj.toLocaleDateString('es-PE');
                const horaStr = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

                // Detectar última persona que intervino
                let ultimaPersona = sol.solicitante_nombre;
                let ultimaAccion = 'Registró';
                if (sol.liquidado_por_nombre) {
                  ultimaPersona = sol.liquidado_por_nombre;
                  ultimaAccion = 'Liquidó';
                } else if (sol.pagado_por_nombre) {
                  ultimaPersona = sol.pagado_por_nombre;
                  ultimaAccion = 'Abonó';
                } else if (sol.aprobado_por_nombre) {
                  ultimaPersona = sol.aprobado_por_nombre;
                  ultimaAccion = 'Aprobó';
                }

                return (
                  <tr key={sol.id}>
                    {/* Código */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                        {sol.codigo}
                      </span>
                    </td>

                    {/* Fecha Registro */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' }}>{fechaStr}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{horaStr}</div>
                    </td>

                    {/* Solicitante */}
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>
                        {sol.solicitante_nombre}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                        DNI: {sol.solicitante_dni}
                      </div>
                    </td>

                    {/* Concepto / Categoría */}
                    <td>
                      <div style={{ fontSize: '0.78rem', color: '#334155', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sol.motivo}>
                        {sol.motivo}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', alignItems: 'center' }}>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem', padding: '0.05rem 0.35rem' }}>
                          {sol.categoria?.replace(/_/g, ' ')}
                        </span>
                        {sol.centro_costo && (
                          <span style={{ fontSize: '0.68rem', color: '#0369a1', fontFamily: 'monospace', fontWeight: '700' }}>
                            [{sol.centro_costo}]
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Monto */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
                        S/ {Number(sol.monto || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {renderBadgeEstado(sol.estado)}
                    </td>

                    {/* Última Intervención */}
                    <td>
                      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>
                        {ultimaPersona}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {ultimaAccion}
                      </div>
                    </td>

                    {/* Acción: Ficha */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setSelectedSol(sol)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.35rem' }}
                      >
                        <Clock size={14} color="#0284c7" />
                        <span>Ficha</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ficha & Timeline de Trazabilidad */}
      {selectedSol && (() => {
        const timeline = buildTimelineForSolicitud(selectedSol);

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
              
              {/* Encabezado del Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '900', color: '#0f172a', fontSize: '1.2rem' }}>
                      {selectedSol.codigo}
                    </span>
                    {renderBadgeEstado(selectedSol.estado)}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Línea de tiempo de auditoría paso a paso
                  </p>
                </div>
                <button onClick={() => setSelectedSol(null)} className="btn btn-ghost btn-icon">
                  <X size={20} />
                </button>
              </div>

              {/* Ficha Resumen de la Solicitud */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Solicitante</span>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>{selectedSol.solicitante_nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>DNI: {selectedSol.solicitante_dni}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Importe</span>
                  <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a' }}>
                    S/ {Number(selectedSol.monto || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {selectedSol.categoria?.replace(/_/g, ' ')} {selectedSol.centro_costo ? `[${selectedSol.centro_costo}]` : ''}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Concepto / Motivo</span>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.15rem' }}>
                    {selectedSol.motivo}
                  </div>
                </div>
              </div>

              {/* Línea de Tiempo (TIMELINE VERTICAL) */}
              <div style={{ padding: '0.5rem 0.25rem' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} color="#0284c7" />
                  <span>Trazabilidad de Hitos y Responsables ({timeline.length} eventos)</span>
                </h4>

                <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
                  {/* Línea vertical conectora continua */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      left: '0.55rem', 
                      top: '0.5rem', 
                      bottom: '0.5rem', 
                      width: '2px', 
                      background: '#cbd5e1' 
                    }} 
                  />

                  {timeline.map((step, idx) => {
                    const IconComp = step.icono || CheckCircle2;
                    let iconBg = '#dcfce7';
                    let iconColor = '#15803d';

                    if (step.tipo === 'INFO') {
                      iconBg = '#e0f2fe';
                      iconColor = '#0369a1';
                    } else if (step.tipo === 'WARNING') {
                      iconBg = '#fef3c7';
                      iconColor = '#b45309';
                    } else if (step.tipo === 'DANGER') {
                      iconBg = '#fee2e2';
                      iconColor = '#dc2626';
                    }

                    const dateObj = new Date(step.fecha);
                    const fechaFormatted = isNaN(dateObj.getTime()) ? step.fecha : dateObj.toLocaleDateString('es-PE');
                    const horaFormatted = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    return (
                      <div key={step.id || idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        
                        {/* Nodo / Icono circular en la línea */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-1.75rem',
                            top: '0',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: iconBg,
                            color: iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 0 3px #ffffff',
                            zIndex: 1
                          }}
                        >
                          <IconComp size={12} />
                        </div>

                        {/* Tarjeta del Evento */}
                        <div 
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem 1rem',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {/* Fila superior: Título y Timestamp */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <div>
                              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.88rem' }}>
                                {step.titulo}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {step.subtitulo}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' }}>
                                {fechaFormatted}
                              </div>
                              {horaFormatted && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                                  {horaFormatted}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Usuario responsable */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.45rem', marginBottom: '0.5rem', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                            <User size={14} color="#64748b" />
                            <div style={{ fontSize: '0.78rem' }}>
                              <strong style={{ color: '#0f172a' }}>{step.usuario}</strong>
                              {step.dni && <span style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>(DNI: {step.dni})</span>}
                              {step.rol && (
                                <span className="badge" style={{ marginLeft: '0.4rem', fontSize: '0.65rem', padding: '0.05rem 0.35rem', background: '#e2e8f0', color: '#334155' }}>
                                  {step.rol}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detalles clave */}
                          {step.detalles && step.detalles.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                              {step.detalles.map((d, dIdx) => (
                                <div key={dIdx} style={{ background: '#f8fafc', padding: '0.35rem 0.55rem', borderRadius: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>{d.etiqueta}:</span>
                                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{d.valor}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Si hay comprobantes adjuntos */}
                          {step.comprobantes && step.comprobantes.length > 0 && (
                            <div style={{ marginTop: '0.65rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                                Comprobantes Sustentados ({step.comprobantes.length}):
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {step.comprobantes.map((c, cIdx) => (
                                  <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.35rem 0.55rem', borderRadius: '4px', fontSize: '0.74rem' }}>
                                    <div>
                                      <strong>{c.tipo} {c.numero}</strong>
                                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                        {c.razonSocial || '-'} {c.ruc ? `(RUC: ${c.ruc})` : ''} • Fecha comprobante: {c.fecha_emision || c.fecha || '-'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <strong style={{ color: '#0f172a' }}>S/ {Number(c.monto || 0).toFixed(2)}</strong>
                                      {c.archivo && (
                                        <a href={c.archivo} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontSize: '0.7rem', textDecoration: 'underline' }}>
                                          Ver
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Si hay sustento URL */}
                          {step.adjuntoUrl && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <a href={step.adjuntoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#0284c7', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <FileCheck size={13} />
                                <span>Ver comprobante / sustento de entrega</span>
                              </a>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Cierre */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
                <button onClick={() => setSelectedSol(null)} className="btn btn-secondary">
                  Cerrar Ficha
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
