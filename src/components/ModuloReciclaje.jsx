import React, { useState, useMemo } from 'react';
import { 
  Recycle, 
  Plus, 
  Search, 
  Calendar, 
  Scale, 
  DollarSign, 
  FileText, 
  Building2, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download, 
  Trash2,
  TrendingUp,
  Wallet,
  Package,
  Layers,
  ArrowDownLeft,
  Clock,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playNotificationSound } from '../lib/audioNotifier';

const MATERIALES_RECICLAJE = [
  { id: 'Cartón', label: 'Cartón / Embalaje', icon: '📦' },
  { id: 'Plástico', label: 'Plástico / Film Stretch', icon: '🧴' },
  { id: 'Chatarra', label: 'Chatarra / Metal', icon: '⚙️' },
  { id: 'Madera', label: 'Madera / Parhuelas', icon: '🪵' },
  { id: 'Otros', label: 'Otros Materiales', icon: '♻️' }
];

export function ModuloReciclaje({ 
  currentUser, 
  cajaFondo, 
  solicitudes = [], 
  onRegistrarVentaReciclaje,
  onAnularVentaReciclaje,
  onRecepcionarVentaReciclaje
}) {
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR') || currentUser?.roles?.includes('SYSADMIN');
  const isCajero = currentUser?.roles?.includes('USUARIO');
  const canRecepcionar = isAdmin || isCajero;
  const isReciclador = currentUser?.roles?.includes('RECICLAJE') || isAdmin;

  // Filtrar exclusivamente los registros de reciclaje
  const ventasReciclaje = useMemo(() => {
    return solicitudes
      .filter(s => s.tipo === 'INGRESO_RECICLAJE')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [solicitudes]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMaterial, setFiltroMaterial] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'PENDIENTE_RECEPCION' | 'INGRESADO_CAJA' | 'ANULADO'
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [viewerImgUrl, setViewerImgUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado del Modal de Recepción de Efectivo en Caja Chica
  const [modalRecepcionOpen, setModalRecepcionOpen] = useState(false);
  const [solicitudARecepcionar, setSolicitudARecepcionar] = useState(null);
  const [notasRecepcion, setNotasRecepcion] = useState('');
  const [isRecepcionando, setIsRecepcionando] = useState(false);

  // Estados del Formulario de Registro
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [material, setMaterial] = useState('Cartón');
  const [pesoKg, setPesoKg] = useState('');
  const [precioKg, setPrecioKg] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [comprador, setComprador] = useState('');
  const [ticketNumero, setTicketNumero] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [sustentoFile, setSustentoFile] = useState(null);
  const [sustentoNombre, setSustentoNombre] = useState('');

  // Auto-calcular importe cuando se ingresa peso y precio por kg
  const handlePesoChange = (val) => {
    setPesoKg(val);
    const p = parseFloat(val);
    const pr = parseFloat(precioKg);
    if (!isNaN(p) && !isNaN(pr) && p > 0 && pr > 0) {
      setMontoTotal((p * pr).toFixed(2));
    }
  };

  const handlePrecioChange = (val) => {
    setPrecioKg(val);
    const p = parseFloat(pesoKg);
    const pr = parseFloat(val);
    if (!isNaN(p) && !isNaN(pr) && p > 0 && pr > 0) {
      setMontoTotal((p * pr).toFixed(2));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('El archivo no debe exceder los 8 MB.');
      return;
    }

    setSustentoNombre(file.name);
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setSustentoFile(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => setSustentoFile(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFecha(new Date().toISOString().slice(0, 10));
    setMaterial('Cartón');
    setPesoKg('');
    setPrecioKg('');
    setMontoTotal('');
    setComprador('');
    setTicketNumero('');
    setObservaciones('');
    setSustentoFile(null);
    setSustentoNombre('');
    setErrorMsg('');
  };

  // Paso 1: Registrar venta (queda en estado PENDIENTE_RECEPCION)
  const handleGuardarVenta = async (e) => {
    e.preventDefault();
    const total = parseFloat(montoTotal);
    if (isNaN(total) || total <= 0) {
      setErrorMsg('Debe ingresar un importe total válido mayor a S/ 0.00');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (onRegistrarVentaReciclaje) {
        await onRegistrarVentaReciclaje({
          monto: total,
          peso_kg: parseFloat(pesoKg) || 0,
          precio_kg: parseFloat(precioKg) || 0,
          material,
          comprador: comprador.trim(),
          ticket_numero: ticketNumero.trim(),
          sustento_url: sustentoFile,
          sustento_nombre: sustentoNombre,
          observaciones: observaciones.trim(),
          usuario: currentUser,
          fecha
        });
      }

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
        playNotificationSound('success');
      } catch (e) {}

      setSuccessMsg(`¡Venta de ${material} registrada exitosamente por S/ ${total.toFixed(2)}! El registro queda PENDIENTE hasta que el dinero sea entregado físicamente y recepcionado en Caja Chica.`);
      setTimeout(() => setSuccessMsg(''), 8000);
      setModalNuevoOpen(false);
      resetForm();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la venta de reciclaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 2: El Cajero / Admin confirma la recepción física y suma al saldo
  const handleConfirmarRecepcion = async (e) => {
    e?.preventDefault();
    if (!solicitudARecepcionar) return;

    setIsRecepcionando(true);
    try {
      if (onRecepcionarVentaReciclaje) {
        await onRecepcionarVentaReciclaje(solicitudARecepcionar.id, notasRecepcion.trim());
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        playNotificationSound('success');
      } catch (e) {}

      setSuccessMsg(`¡Dinero recepcionado en Caja Chica! Se sumaron S/ ${Number(solicitudARecepcionar.monto).toFixed(2)} al saldo disponible.`);
      setTimeout(() => setSuccessMsg(''), 8000);
      setModalRecepcionOpen(false);
      setSolicitudARecepcionar(null);
      setNotasRecepcion('');
      if (selectedDetalle?.id === solicitudARecepcionar.id) {
        setSelectedDetalle(null);
      }
    } catch (err) {
      alert('Error al recepcionar el dinero: ' + err.message);
    } finally {
      setIsRecepcionando(false);
    }
  };

  const handleAnular = async (sol) => {
    if (!isAdmin) return;
    const yaIngreso = sol.estado === 'INGRESADO_CAJA';
    const msgConfirm = yaIngreso 
      ? `¿Está seguro de anular la venta ${sol.codigo} por S/ ${Number(sol.monto).toFixed(2)}?\n\nEsta venta YA había ingresado a Caja Chica, por lo que este importe SE DESCONTARÁ del saldo disponible.\n\nIngrese el motivo de anulación:`
      : `¿Está seguro de anular la venta ${sol.codigo} por S/ ${Number(sol.monto).toFixed(2)}?\n\n(Aún no había ingresado al saldo de caja).\n\nIngrese el motivo de anulación:`;

    const confirmacion = window.prompt(msgConfirm);
    if (confirmacion === null) return;

    try {
      if (onAnularVentaReciclaje) {
        await onAnularVentaReciclaje(sol.id, currentUser, confirmacion);
      }
      setSuccessMsg(`Venta ${sol.codigo} anulada.${yaIngreso ? ' El saldo de Caja Chica fue ajustado.' : ''}`);
      setTimeout(() => setSuccessMsg(''), 7000);
      if (selectedDetalle?.id === sol.id) {
        setSelectedDetalle(null);
      }
    } catch (err) {
      alert('Error anulando venta: ' + err.message);
    }
  };

  // Métricas y Estadísticas
  const ventasActivas = ventasReciclaje.filter(v => v.estado !== 'ANULADO');
  const ventasRecepcionadas = ventasReciclaje.filter(v => v.estado === 'INGRESADO_CAJA');
  const ventasPendientes = ventasReciclaje.filter(v => v.estado === 'PENDIENTE_RECEPCION');

  const totalMontoRecepcionado = ventasRecepcionadas.reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
  const totalMontoPendiente = ventasPendientes.reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
  
  const totalKilos = ventasActivas.reduce((acc, cur) => {
    let peso = 0;
    try {
      if (cur.observaciones_aprobador) {
        const parsed = JSON.parse(cur.observaciones_aprobador);
        peso = Number(parsed.peso_kg || 0);
      }
    } catch (e) {}
    return acc + peso;
  }, 0);

  const saldoDisponibleActual = Number(cajaFondo?.monto_disponible || 0);

  // Filtrado de la tabla
  const ventasFiltradas = ventasReciclaje.filter(v => {
    if (filtroEstado !== 'TODOS' && v.estado !== filtroEstado) return false;

    if (filtroMaterial !== 'TODOS') {
      try {
        const parsed = JSON.parse(v.observaciones_aprobador || '{}');
        if (parsed.material !== filtroMaterial) return false;
      } catch (e) {
        if (!v.motivo.toLowerCase().includes(filtroMaterial.toLowerCase())) return false;
      }
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCod = (v.codigo || '').toLowerCase().includes(q);
      const matchResp = (v.solicitante_nombre || '').toLowerCase().includes(q);
      const matchComp = (v.comprobante_razon_social || '').toLowerCase().includes(q);
      const matchTicket = (v.comprobante_numero || '').toLowerCase().includes(q);
      const matchMotivo = (v.motivo || '').toLowerCase().includes(q);
      return matchCod || matchResp || matchComp || matchTicket || matchMotivo;
    }
    return true;
  });

  return (
    <div>
      {/* Encabezado Principal */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #a7f3d0'
          }}>
            <Recycle size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Venta de Reciclaje (Cartón y Materiales)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: 0 }}>
              Flujo de 2 pasos: 1. Registro de venta por el operador. 2. Recepción física en Caja Chica para sumar al saldo.
            </p>
          </div>
        </div>

        {isReciclador && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalNuevoOpen(true);
            }}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#059669',
              borderColor: '#047857',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Plus size={18} />
            <span>Registrar Venta de Cartón</span>
          </button>
        )}
      </div>

      {/* Alerta Informativa / Éxito */}
      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          color: '#065f46',
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <span style={{ fontWeight: '600' }}>{successMsg}</span>
        </div>
      )}

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {/* KPI 1: Recepcionado en Caja */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#047857' }}>
              S/ {totalMontoRecepcionado.toFixed(2)}
            </div>
            <div className="stat-label">Ingresado a Caja Chica ({ventasRecepcionadas.length})</div>
          </div>
        </div>

        {/* KPI 2: Pendiente de Recepción */}
        <div className="stat-card" style={{ borderColor: totalMontoPendiente > 0 ? '#fde68a' : undefined }}>
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: totalMontoPendiente > 0 ? '#b45309' : '#64748b' }}>
              S/ {totalMontoPendiente.toFixed(2)}
            </div>
            <div className="stat-label">
              Pendiente por Entregar ({ventasPendientes.length})
            </div>
          </div>
        </div>

        {/* KPI 3: Kilos Totales */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <Scale size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#1d4ed8' }}>
              {totalKilos > 0 ? `${totalKilos.toFixed(1)} Kg` : '0.0 Kg'}
            </div>
            <div className="stat-label">Kilos Totales Vendidos</div>
          </div>
        </div>

        {/* KPI 4: Saldo Disponible */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            <Wallet size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#0f172a' }}>
              S/ {saldoDisponibleActual.toFixed(2)}
            </div>
            <div className="stat-label">Saldo Disponible Actual</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Estado */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFiltroEstado('TODOS')}
          className={`btn btn-sm ${filtroEstado === 'TODOS' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
        >
          Todos ({ventasReciclaje.length})
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado('PENDIENTE_RECEPCION')}
          className={`btn btn-sm ${filtroEstado === 'PENDIENTE_RECEPCION' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            borderColor: ventasPendientes.length > 0 ? '#fde68a' : undefined
          }}
        >
          <Clock size={14} color={filtroEstado === 'PENDIENTE_RECEPCION' ? '#fff' : '#d97706'} />
          <span>Pendientes de Entrega</span>
          {ventasPendientes.length > 0 && (
            <span style={{
              background: filtroEstado === 'PENDIENTE_RECEPCION' ? 'rgba(255,255,255,0.3)' : '#fef3c7',
              color: filtroEstado === 'PENDIENTE_RECEPCION' ? '#fff' : '#b45309',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: '700'
            }}>
              {ventasPendientes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado('INGRESADO_CAJA')}
          className={`btn btn-sm ${filtroEstado === 'INGRESADO_CAJA' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <CheckCircle2 size={14} color={filtroEstado === 'INGRESADO_CAJA' ? '#fff' : '#059669'} />
          <span>Recepcionados en Caja ({ventasRecepcionadas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado('ANULADO')}
          className={`btn btn-sm ${filtroEstado === 'ANULADO' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
        >
          Anulados ({ventasReciclaje.filter(v => v.estado === 'ANULADO').length})
        </button>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por código (REC-...), responsable, comprador o ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Material:</span>
          <select
            className="form-select"
            value={filtroMaterial}
            onChange={(e) => setFiltroMaterial(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', minWidth: '150px' }}
          >
            <option value="TODOS">Todos los materiales</option>
            {MATERIALES_RECICLAJE.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Registros de Reciclaje */}
      <div className="glass-panel" style={{ padding: '0.75rem' }}>
        <div className="table-responsive sticky-page-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha Venta</th>
                <th>Registrado Por</th>
                <th>Material</th>
                <th>Pesaje & Precio</th>
                <th>Importe</th>
                <th>Comprador / Ticket</th>
                <th style={{ textAlign: 'center' }}>Sustento</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Recycle size={32} color="#cbd5e1" />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>No hay ventas que coincidan con el filtro</span>
                      <span style={{ fontSize: '0.78rem' }}>Haz clic en "Registrar Venta de Cartón" para registrar una nueva venta.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((s) => {
                  let parsed = {};
                  try {
                    parsed = JSON.parse(s.observaciones_aprobador || '{}');
                  } catch (e) {}

                  const isAnulado = s.estado === 'ANULADO';
                  const isPendiente = s.estado === 'PENDIENTE_RECEPCION';
                  const isIngresado = s.estado === 'INGRESADO_CAJA';

                  return (
                    <tr key={s.id} style={{ opacity: isAnulado ? 0.5 : 1 }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: isAnulado ? '#94a3b8' : isIngresado ? '#047857' : '#b45309' }}>
                        {s.codigo}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {new Date(s.created_at).toLocaleDateString('es-PE')}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>
                          {s.solicitante_nombre}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          DNI: {s.solicitante_dni}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-reciclaje">
                          {parsed.material || 'Cartón'}
                        </span>
                      </td>
                      <td>
                        {parsed.peso_kg > 0 ? (
                          <div style={{ fontSize: '0.82rem' }}>
                            <strong>{parsed.peso_kg} Kg</strong>
                            {parsed.precio_kg > 0 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {' '}@ S/ {Number(parsed.precio_kg).toFixed(2)}/Kg
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: isAnulado ? '#94a3b8' : isIngresado ? '#059669' : '#d97706',
                          fontWeight: '800',
                          fontSize: '0.95rem'
                        }}>
                          <ArrowDownLeft size={16} />
                          <span>+ S/ {Number(s.monto).toFixed(2)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a' }}>
                          {parsed.comprador || s.comprobante_razon_social || 'Reciclador Local'}
                        </div>
                        {(parsed.ticket_numero || s.comprobante_numero) && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Ticket: {parsed.ticket_numero || s.comprobante_numero}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.abono_sustento_url ? (
                          <button
                            type="button"
                            onClick={() => setViewerImgUrl(s.abono_sustento_url)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Ver ticket / comprobante adjunto"
                          >
                            <Eye size={13} />
                            <span>Ver Ticket</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sin foto</span>
                        )}
                      </td>
                      <td>
                        {isPendiente && (
                          <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> PENDIENTE ENTREGA
                          </span>
                        )}
                        {isIngresado && (
                          <div>
                            <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CheckCircle2 size={12} /> EN CAJA CHICA
                            </span>
                            {s.pagado_por_nombre && (
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                                Recibió: {s.pagado_por_nombre}
                              </div>
                            )}
                          </div>
                        )}
                        {isAnulado && (
                          <span className="badge badge-rechazado">
                            ANULADO
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Botón de Recepcionar Efectivo si está pendiente */}
                          {isPendiente && canRecepcionar && (
                            <button
                              type="button"
                              onClick={() => {
                                setSolicitudARecepcionar(s);
                                setNotasRecepcion('');
                                setModalRecepcionOpen(true);
                              }}
                              className="btn btn-primary"
                              style={{
                                background: '#059669',
                                borderColor: '#047857',
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: '700'
                              }}
                              title="Confirmar recepción física del dinero y sumar al saldo"
                            >
                              <Check size={14} />
                              <span>Recepcionar</span>
                            </button>
                          )}

                          {isPendiente && !canRecepcionar && (
                            <span style={{ fontSize: '0.72rem', color: '#b45309', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: '600' }}>
                              Entregar a Caja
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedDetalle(s)}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Ver detalle del registro"
                          >
                            <Eye size={14} />
                          </button>

                          {isAdmin && !isAnulado && (
                            <button
                              type="button"
                              onClick={() => handleAnular(s)}
                              className="btn btn-ghost"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                              title="Anular venta"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REGISTRAR NUEVA VENTA DE RECICLAJE */}
      {modalNuevoOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Recycle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '800', margin: 0 }}>
                    Registrar Venta de Reciclaje
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Paso 1: Registra la venta. El dinero quedará pendiente hasta su entrega en Caja Chica.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                className="btn btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aviso explicativo del paso intermedio */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#92400e'
            }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Flujo de Control:</strong> Al guardar este registro, el dinero <strong>NO se sumará al saldo inmediatamente</strong>. Quedará en estado <em>"Pendiente de Entrega"</em> hasta que el encargado de Caja Chica confirme la recepción física del dinero.
              </div>
            </div>

            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.75rem',
                color: '#991b1b',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleGuardarVenta}>
              {/* Fecha y Material */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    Fecha de Venta *
                  </label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    Tipo de Material *
                  </label>
                  <select
                    className="form-select"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    required
                  >
                    {MATERIALES_RECICLAJE.map(m => (
                      <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kilos y Precio por Kg */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    Peso Total (Kg)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Scale size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej. 120.5"
                      className="form-control"
                      value={pesoKg}
                      onChange={(e) => handlePesoChange(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    Precio por Kg (S/)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej. 0.45"
                      className="form-control"
                      value={precioKg}
                      onChange={(e) => handlePrecioChange(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Monto Total Calculado */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '800', color: '#047857' }}>
                  Total a Entregar a Caja Chica (S/) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#059669', fontSize: '1.1rem' }}>S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="form-control"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    style={{
                      paddingLeft: '2.5rem',
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      color: '#047857',
                      background: '#ecfdf5',
                      borderColor: '#a7f3d0'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Este es el importe físico en efectivo que deberá recepcionar el encargado de Caja Chica.
                </span>
              </div>

              {/* Comprador y N° Ticket */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    Comprador / Empresa
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Ej. Recicladora Lima SAC"
                      className="form-control"
                      value={comprador}
                      onChange={(e) => setComprador(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    N° Ticket / Boleta Pesaje
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Ej. T-00452"
                      className="form-control"
                      value={ticketNumero}
                      onChange={(e) => setTicketNumero(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Foto de Ticket de Pesaje / Sustento */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                  Foto del Ticket de Pesaje / Comprobante (Recomendado)
                </label>
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    id="sustento-reciclaje-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="sustento-reciclaje-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Camera size={26} color="#059669" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                      {sustentoNombre ? sustentoNombre : 'Haga clic para tomar foto o adjuntar ticket'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Formatos JPG, PNG o PDF (máx 8 MB)
                    </span>
                  </label>
                </div>

                {sustentoFile && sustentoFile.startsWith('data:image') && (
                  <div style={{ marginTop: '0.65rem', position: 'relative', display: 'inline-block' }}>
                    <img
                      src={sustentoFile}
                      alt="Vista previa"
                      style={{ height: '90px', borderRadius: '6px', border: '1px solid #cbd5e1', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSustentoFile(null);
                        setSustentoNombre('');
                      }}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                  Observaciones Adicionales
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Detalles adicionales sobre el lote, estado del material, etc."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    background: '#059669',
                    borderColor: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.25rem',
                    fontWeight: '700'
                  }}
                >
                  <Plus size={16} />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar Venta (Pendiente de Entrega)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR RECEPCIÓN FÍSICA DE DINERO EN CAJA CHICA */}
      {modalRecepcionOpen && solicitudARecepcionar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid #a7f3d0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: '800', margin: 0 }}>
                    Recepcionar Efectivo en Caja
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {solicitudARecepcionar.codigo} • Entregado por {solicitudARecepcionar.solicitante_nombre}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRecepcionOpen(false)}
                className="btn btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarRecepcion}>
              {/* Tarjeta de Resumen Financiero */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '1.15rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Efectivo Físico a Ingresar a Caja Chica
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#047857' }}>
                  + S/ {Number(solicitudARecepcionar.monto).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.25rem' }}>
                  {solicitudARecepcionar.motivo}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginTop: '0.85rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px dashed #86efac',
                  fontSize: '0.78rem'
                }}>
                  <div>
                    <span style={{ color: '#475569', display: 'block' }}>Saldo Caja Actual:</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>S/ {saldoDisponibleActual.toFixed(2)}</strong>
                  </div>
                  <div style={{ color: '#15803d', fontWeight: '700', alignSelf: 'center' }}>➔</div>
                  <div>
                    <span style={{ color: '#15803d', display: 'block', fontWeight: '700' }}>Nuevo Saldo Disponible:</span>
                    <strong style={{ color: '#047857', fontSize: '1rem', fontWeight: '900' }}>
                      S/ {(saldoDisponibleActual + Number(solicitudARecepcionar.monto)).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Campo de Notas de Recepción */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                  Notas de Recepción del Cajero (Opcional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Dinero recibido en sobre / en efectivo en ventanilla"
                  value={notasRecepcion}
                  onChange={(e) => setNotasRecepcion(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalRecepcionOpen(false)}
                  className="btn btn-secondary"
                  disabled={isRecepcionando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isRecepcionando}
                  className="btn btn-primary"
                  style={{
                    background: '#059669',
                    borderColor: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    fontWeight: '700'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isRecepcionando ? 'Recepcionando...' : 'Confirmar Recepción y Sumar al Saldo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VER DETALLE DE VENTA */}
      {selectedDetalle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            maxWidth: '520px',
            width: '100%',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-reciclaje" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  VENTA DE RECICLAJE
                </span>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '800', margin: 0 }}>
                  {selectedDetalle.codigo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetalle(null)}
                className="btn btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              let p = {};
              try {
                p = JSON.parse(selectedDetalle.observaciones_aprobador || '{}');
              } catch (e) {}

              const isPend = selectedDetalle.estado === 'PENDIENTE_RECEPCION';
              const isIngr = selectedDetalle.estado === 'INGRESADO_CAJA';
              const isAnul = selectedDetalle.estado === 'ANULADO';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Tarjeta de Importe y Estado */}
                  <div style={{
                    padding: '1rem',
                    background: isIngr ? '#f0fdf4' : isPend ? '#fffbeb' : '#fef2f2',
                    border: `1px solid ${isIngr ? '#bbf7d0' : isPend ? '#fde68a' : '#fecaca'}`,
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '0.78rem',
                      color: isIngr ? '#166534' : isPend ? '#92400e' : '#991b1b',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {isIngr ? 'Efectivo Ingresado a Caja Chica' : isPend ? 'Pendiente de Entrega en Caja Chica' : 'Venta Anulada'}
                    </div>
                    <div style={{
                      fontSize: '1.85rem',
                      fontWeight: '900',
                      color: isIngr ? '#047857' : isPend ? '#b45309' : '#dc2626'
                    }}>
                      + S/ {Number(selectedDetalle.monto).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isIngr ? '#15803d' : '#475569' }}>
                      {p.peso_kg > 0 ? `${p.peso_kg} Kg de ${p.material || 'Cartón'}` : p.material || 'Cartón'}
                      {p.precio_kg > 0 ? ` @ S/ ${Number(p.precio_kg).toFixed(2)} / Kg` : ''}
                    </div>
                  </div>

                  {/* Estado del flujo */}
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span><strong>Paso 1 (Registrado):</strong> Por {selectedDetalle.solicitante_nombre} el {new Date(selectedDetalle.created_at).toLocaleString('es-PE')}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isIngr ? (
                        <>
                          <CheckCircle2 size={16} color="#059669" />
                          <span><strong>Paso 2 (Recepcionado en Caja):</strong> Por {selectedDetalle.pagado_por_nombre || p.recepcionado_por || 'Caja'} el {selectedDetalle.pagado_fecha ? new Date(selectedDetalle.pagado_fecha).toLocaleString('es-PE') : '-'}</span>
                        </>
                      ) : isPend ? (
                        <>
                          <Clock size={16} color="#d97706" />
                          <span style={{ color: '#b45309' }}><strong>Paso 2 (Pendiente):</strong> Esperando entrega física del efectivo en ventanilla de Caja Chica. (Aún no suma al saldo).</span>
                        </>
                      ) : (
                        <>
                          <X size={16} color="#dc2626" />
                          <span style={{ color: '#dc2626' }}><strong>Registro Anulado</strong></span>
                        </>
                      )}
                    </div>

                    {p.notas_recepcion && (
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginLeft: '1.4rem' }}>
                        <em>Nota recepción: {p.notas_recepcion}</em>
                      </div>
                    )}
                  </div>

                  {/* Grid de Metadatos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Comprador:</span>
                      <div style={{ fontWeight: '600' }}>{p.comprador || selectedDetalle.comprobante_razon_social || '-'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>N° Ticket:</span>
                      <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>{p.ticket_numero || selectedDetalle.comprobante_numero || '-'}</div>
                    </div>
                  </div>

                  {p.notas && (
                    <div style={{ fontSize: '0.82rem', background: '#f8fafc', padding: '0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: '700' }}>Notas del vendedor:</span>
                      {p.notas}
                    </div>
                  )}

                  {selectedDetalle.abono_sustento_url && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem', fontWeight: '700' }}>Foto del Ticket:</span>
                      <img
                        src={selectedDetalle.abono_sustento_url}
                        alt="Ticket pesaje"
                        style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                        onClick={() => setViewerImgUrl(selectedDetalle.abono_sustento_url)}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDetalle(null)}
                      className="btn btn-secondary"
                    >
                      Cerrar
                    </button>

                    {isPend && canRecepcionar && (
                      <button
                        type="button"
                        onClick={() => {
                          setSolicitudARecepcionar(selectedDetalle);
                          setNotasRecepcion('');
                          setModalRecepcionOpen(true);
                        }}
                        className="btn btn-primary"
                        style={{ background: '#059669', borderColor: '#047857', fontWeight: '700' }}
                      >
                        <Check size={16} /> Recepcionar Efectivo
                      </button>
                    )}

                    {isAdmin && !isAnul && (
                      <button
                        type="button"
                        onClick={() => handleAnular(selectedDetalle)}
                        className="btn btn-danger"
                      >
                        Anular Registro
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 4: VISUALIZADOR DE FOTO EN PANTALLA COMPLETA */}
      {viewerImgUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <button
            type="button"
            onClick={() => setViewerImgUrl(null)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
          <img
            src={viewerImgUrl}
            alt="Comprobante Ticket"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      )}
    </div>
  );
}
