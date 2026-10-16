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
  Check,
  Sparkles
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
            className="form-input"
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

      {/* =========================================================================
          MODAL 1: REGISTRAR NUEVA VENTA DE RECICLAJE (DISEÑO CORPORATIVO PREMIUM)
          ========================================================================= */}
      {modalNuevoOpen && (
        <div className="modal-overlay" onClick={() => setModalNuevoOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '580px', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Recycle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '800', margin: 0, lineHeight: 1.2 }}>
                    Registrar Venta de Reciclaje
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
                    Paso 1: Registra la venta. El dinero quedará pendiente hasta su entrega en Caja Chica.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                className="btn-close"
                title="Cerrar ventana"
              >
                <X size={20} />
              </button>
            </div>

            {/* Aviso Informativo: Flujo de Control en 2 Pasos */}
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}>
                <AlertCircle size={17} />
              </div>
              <div style={{ fontSize: '0.825rem', color: '#92400e', lineHeight: 1.45 }}>
                <strong style={{ display: 'block', color: '#78350f', marginBottom: '0.15rem' }}>
                  Flujo de Control de Efectivo
                </strong>
                Al guardar, el registro quedará como <strong>"Pendiente de Entrega"</strong>. El dinero <strong>NO se sumará al saldo</strong> hasta que el encargado de Caja Chica confirme la recepción física del efectivo.
              </div>
            </div>

            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                color: '#991b1b',
                fontSize: '0.85rem',
                marginBottom: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={17} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleGuardarVenta}>
              {/* Fila 1: Fecha de Venta y Tipo de Material */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.15rem'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                    Fecha de Venta *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar 
                      size={17} 
                      style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} 
                    />
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                    Tipo de Material *
                  </label>
                  <select
                    className="form-select"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    required
                    style={{ height: '42px', fontSize: '0.875rem' }}
                  >
                    {MATERIALES_RECICLAJE.map(m => (
                      <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 2: Peso Total y Precio por Kg */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.15rem'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                    Peso Total (Kg)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Scale 
                      size={17} 
                      style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} 
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej. 120.5"
                      className="form-input"
                      value={pesoKg}
                      onChange={(e) => handlePesoChange(e.target.value)}
                      style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                    Precio por Kg (S/)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '0.95rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      fontWeight: '700', 
                      color: '#94a3b8', 
                      pointerEvents: 'none', 
                      fontSize: '0.9rem' 
                    }}>
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej. 0.45"
                      className="form-input"
                      value={precioKg}
                      onChange={(e) => handlePrecioChange(e.target.value)}
                      style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Fila 3: Hero Card - Total a Entregar en Caja Chica */}
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem 1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '0.5rem', 
                  flexWrap: 'wrap', 
                  gap: '0.4rem' 
                }}>
                  <label style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '800', 
                    color: '#166534', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.03em', 
                    margin: 0 
                  }}>
                    Total a Entregar a Caja Chica (Efectivo Físico) *
                  </label>
                  {pesoKg && precioKg && !isNaN(parseFloat(pesoKg)) && !isNaN(parseFloat(precioKg)) && (
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: '#dcfce7', 
                      color: '#15803d', 
                      padding: '2px 8px', 
                      borderRadius: '999px', 
                      fontWeight: '700' 
                    }}>
                      Auto: {pesoKg} Kg × S/ {precioKg}
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    fontSize: '1.35rem',
                    fontWeight: '900',
                    color: '#059669',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}>
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="form-input"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    style={{
                      paddingLeft: '3rem',
                      height: '52px',
                      fontSize: '1.65rem',
                      fontWeight: '900',
                      color: '#047857',
                      background: '#ffffff',
                      borderColor: '#86efac',
                      borderRadius: '10px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.08)'
                    }}
                  />
                </div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#15803d', 
                  margin: 0, 
                  marginTop: '0.45rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem' 
                }}>
                  <span>💡</span>
                  <span>Este importe en efectivo deberá ser recibido y confirmado por el encargado de Caja Chica.</span>
                </p>
              </div>

              {/* Fila 4: Comprador / Empresa y N° Ticket */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.15rem'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                    Comprador / Empresa
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 
                      size={17} 
                      style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} 
                    />
                    <input
                      type="text"
                      placeholder="Ej. Recicladora Lima SAC"
                      className="form-input"
                      value={comprador}
                      onChange={(e) => setComprador(e.target.value)}
                      style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                    N° Ticket / Boleta Pesaje
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileText 
                      size={17} 
                      style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} 
                    />
                    <input
                      type="text"
                      placeholder="Ej. T-00452"
                      className="form-input"
                      value={ticketNumero}
                      onChange={(e) => setTicketNumero(e.target.value)}
                      style={{ paddingLeft: '2.5rem', height: '42px', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Fila 5: Foto del Ticket de Pesaje / Sustento */}
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                  Foto del Ticket de Pesaje / Sustento (Recomendado)
                </label>

                {!sustentoFile ? (
                  <div style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      id="sustento-reciclaje-input"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="sustento-reciclaje-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Camera size={22} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>
                        Haga clic para tomar foto o adjuntar ticket
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Formatos JPG, PNG o PDF (máx. 8 MB)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      {sustentoFile.startsWith('data:image') ? (
                        <img
                          src={sustentoFile}
                          alt="Vista previa"
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={22} />
                        </div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {sustentoNombre || 'Ticket adjunto'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>
                          ✓ Archivo listo para enviar
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSustentoFile(null);
                        setSustentoNombre('');
                      }}
                      className="btn btn-ghost"
                      style={{ color: '#dc2626', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                      title="Eliminar archivo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Fila 6: Observaciones Adicionales */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                  Observaciones Adicionales
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Detalles sobre el lote, merma, estado del material, etc."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Pie con Botones de Acción */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  style={{ padding: '0.65rem 1.25rem', height: '42px', fontWeight: '600' }}
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
                    padding: '0.65rem 1.4rem',
                    height: '42px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <Plus size={17} />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar Venta (Pendiente de Entrega)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIRMAR RECEPCIÓN FÍSICA EN CAJA CHICA (FINTECH STYLE)
          ========================================================================= */}
      {modalRecepcionOpen && solicitudARecepcionar && (
        <div className="modal-overlay" onClick={() => setModalRecepcionOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '520px', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '800', margin: 0 }}>
                    Recepcionar Efectivo en Caja
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {solicitudARecepcionar.codigo} • Entregado por {solicitudARecepcionar.solicitante_nombre}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRecepcionOpen(false)}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarRecepcion}>
              {/* Resumen Financiero con Diferencial de Saldo */}
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  Efectivo Físico por Ingresar a Caja Chica
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#047857' }}>
                  + S/ {Number(solicitudARecepcionar.monto).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.825rem', color: '#15803d', marginTop: '0.25rem' }}>
                  {solicitudARecepcionar.motivo}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginTop: '1rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px dashed #86efac',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <span style={{ color: '#475569', display: 'block', fontSize: '0.75rem' }}>Saldo Actual en Caja:</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>S/ {saldoDisponibleActual.toFixed(2)}</strong>
                  </div>
                  <div style={{ color: '#15803d', fontWeight: '800', alignSelf: 'center', fontSize: '1.1rem' }}>➔</div>
                  <div>
                    <span style={{ color: '#15803d', display: 'block', fontWeight: '700', fontSize: '0.75rem' }}>Nuevo Saldo Resultante:</span>
                    <strong style={{ color: '#047857', fontSize: '1.1rem', fontWeight: '900' }}>
                      S/ {(saldoDisponibleActual + Number(solicitudARecepcionar.monto)).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Notas de Recepción */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155' }}>
                  Notas de Recepción del Cajero (Opcional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Dinero recibido en efectivo en ventanilla de caja"
                  value={notasRecepcion}
                  onChange={(e) => setNotasRecepcion(e.target.value)}
                  style={{ height: '42px', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setModalRecepcionOpen(false)}
                  className="btn btn-secondary"
                  disabled={isRecepcionando}
                  style={{ padding: '0.65rem 1.25rem', height: '42px', fontWeight: '600' }}
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
                    gap: '0.45rem',
                    padding: '0.65rem 1.4rem',
                    height: '42px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <CheckCircle2 size={17} />
                  <span>{isRecepcionando ? 'Recepcionando...' : 'Confirmar Recepción y Sumar al Saldo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: VER DETALLE COMPLETO DE VENTA (CICLO DE VIDA DE 2 PASOS)
          ========================================================================= */}
      {selectedDetalle && (
        <div className="modal-overlay" onClick={() => setSelectedDetalle(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '540px', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.85rem'
            }}>
              <div>
                <span className="badge badge-reciclaje" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  VENTA DE RECICLAJE
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '800', margin: 0 }}>
                  {selectedDetalle.codigo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetalle(null)}
                className="btn-close"
              >
                <X size={20} />
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Tarjeta de Importe y Estado */}
                  <div style={{
                    padding: '1.15rem',
                    background: isIngr ? '#f0fdf4' : isPend ? '#fffbeb' : '#fef2f2',
                    border: `1.5px solid ${isIngr ? '#86efac' : isPend ? '#fde68a' : '#fecaca'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '0.78rem',
                      color: isIngr ? '#166534' : isPend ? '#92400e' : '#991b1b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {isIngr ? 'Efectivo Ingresado a Caja Chica' : isPend ? 'Pendiente de Entrega en Caja Chica' : 'Venta Anulada'}
                    </div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '900',
                      color: isIngr ? '#047857' : isPend ? '#b45309' : '#dc2626'
                    }}>
                      + S/ {Number(selectedDetalle.monto).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isIngr ? '#15803d' : '#475569', marginTop: '0.15rem' }}>
                      {p.peso_kg > 0 ? `${p.peso_kg} Kg de ${p.material || 'Cartón'}` : p.material || 'Cartón'}
                      {p.precio_kg > 0 ? ` @ S/ ${Number(p.precio_kg).toFixed(2)} / Kg` : ''}
                    </div>
                  </div>

                  {/* Estado del flujo de 2 pasos */}
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.825rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span><strong>Paso 1 (Registrado):</strong> Por {selectedDetalle.solicitante_nombre} el {new Date(selectedDetalle.created_at).toLocaleString('es-PE')}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginLeft: '1.5rem', background: '#ffffff', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <em>Nota recepción: {p.notas_recepcion}</em>
                      </div>
                    )}
                  </div>

                  {/* Grid de Metadatos */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    fontSize: '0.825rem',
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Comprador:</span>
                      <strong style={{ color: '#0f172a' }}>{p.comprador || selectedDetalle.comprobante_razon_social || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>N° Ticket:</span>
                      <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{p.ticket_numero || selectedDetalle.comprobante_numero || '-'}</strong>
                    </div>
                  </div>

                  {p.notas && (
                    <div style={{ fontSize: '0.825rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: '700', marginBottom: '0.15rem' }}>Notas del vendedor:</span>
                      {p.notas}
                    </div>
                  )}

                  {selectedDetalle.abono_sustento_url && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: '0.4rem', fontWeight: '700' }}>Ticket de Pesaje / Sustento:</span>
                      <img
                        src={selectedDetalle.abono_sustento_url}
                        alt="Ticket pesaje"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#0f172a' }}
                        onClick={() => setViewerImgUrl(selectedDetalle.abono_sustento_url)}
                      />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
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

      {/* =========================================================================
          MODAL 4: VISUALIZADOR DE FOTO EN PANTALLA COMPLETA
          ========================================================================= */}
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
          padding: '1rem',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <button
            type="button"
            onClick={() => setViewerImgUrl(null)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
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
