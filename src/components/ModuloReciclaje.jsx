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
  ArrowDownLeft
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
  onAnularVentaReciclaje
}) {
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR') || currentUser?.roles?.includes('SYSADMIN');
  const isReciclador = currentUser?.roles?.includes('RECICLAJE') || isAdmin;

  // Filtrar exclusivamente los registros de reciclaje
  const ventasReciclaje = useMemo(() => {
    return solicitudes
      .filter(s => s.tipo === 'INGRESO_RECICLAJE')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [solicitudes]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMaterial, setFiltroMaterial] = useState('TODOS');
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [viewerImgUrl, setViewerImgUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

      setSuccessMsg(`¡Venta de ${material} registrada exitosamente! Se sumaron S/ ${total.toFixed(2)} al saldo de Caja Chica.`);
      setTimeout(() => setSuccessMsg(''), 7000);
      setModalNuevoOpen(false);
      resetForm();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la venta de reciclaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnular = async (sol) => {
    if (!isAdmin) return;
    const confirmacion = window.prompt(`¿Está seguro de anular la venta ${sol.codigo} por S/ ${Number(sol.monto).toFixed(2)}?\n\nEste importe se descontará del saldo disponible de Caja Chica.\nIngrese el motivo de anulación:`);
    if (confirmacion === null) return;

    try {
      if (onAnularVentaReciclaje) {
        await onAnularVentaReciclaje(sol.id, currentUser, confirmacion);
      }
      setSuccessMsg(`Venta ${sol.codigo} anulada. El saldo de Caja Chica fue ajustado.`);
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
  const totalMontoReciclaje = ventasActivas.reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
  
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
              Registro de ingresos por venta de reciclaje operativo que regresan al saldo de Caja Chica.
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

      {/* Alerta de Éxito */}
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
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#047857' }}>
              S/ {totalMontoReciclaje.toFixed(2)}
            </div>
            <div className="stat-label">Total Ingresado a Caja</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
            <Scale size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#b45309' }}>
              {totalKilos > 0 ? `${totalKilos.toFixed(1)} Kg` : '0.0 Kg'}
            </div>
            <div className="stat-label">Kilos Totales Vendidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="stat-value">{ventasActivas.length}</div>
            <div className="stat-label">Ventas Registradas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            <Wallet size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#0f172a' }}>
              S/ {saldoDisponibleActual.toFixed(2)}
            </div>
            <div className="stat-label">Saldo Disponible en Caja</div>
          </div>
        </div>
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
                <th>Fecha</th>
                <th>Registrado Por</th>
                <th>Material</th>
                <th>Pesaje & Precio</th>
                <th>Importe Ingresado</th>
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
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>No hay ventas de reciclaje registradas</span>
                      <span style={{ fontSize: '0.78rem' }}>Haz clic en "Registrar Venta de Cartón" para ingresar dinero a Caja Chica.</span>
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

                  return (
                    <tr key={s.id} style={{ opacity: isAnulado ? 0.5 : 1 }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: isAnulado ? '#94a3b8' : '#047857' }}>
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
                          color: isAnulado ? '#94a3b8' : '#059669',
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
                        <span className={`badge ${isAnulado ? 'badge-rechazado' : 'badge-ingreso'}`}>
                          {isAnulado ? 'ANULADO' : 'INGRESADO A CAJA'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDetalle(s)}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Ver detalle de la venta"
                          >
                            <Eye size={14} />
                          </button>

                          {isAdmin && !isAnulado && (
                            <button
                              type="button"
                              onClick={() => handleAnular(s)}
                              className="btn btn-ghost"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                              title="Anular venta y descontar de caja"
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

      {/* MODAL: REGISTRAR NUEVA VENTA DE RECICLAJE */}
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
                    El importe ingresado se sumará automáticamente al saldo de Caja Chica.
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

            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                color: '#b91c1c',
                fontSize: '0.825rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleGuardarVenta}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fecha de Venta *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de Material *</label>
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

              {/* Fila de Peso y Precio por Kg */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Peso en Kg</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej. 120.5"
                    className="form-control"
                    value={pesoKg}
                    onChange={(e) => handlePesoChange(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Precio / Kg (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej. 0.40"
                    className="form-control"
                    value={precioKg}
                    onChange={(e) => handlePrecioChange(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#047857', fontWeight: '700' }}>
                    Total a Ingresar (S/) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#059669' }}>
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      placeholder="0.00"
                      className="form-control"
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(e.target.value)}
                      required
                      style={{ paddingLeft: '2.25rem', fontWeight: '800', fontSize: '1.05rem', color: '#047857' }}
                    />
                  </div>
                </div>
              </div>

              {/* Comprador y Ticket */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Comprador / Empresa Recicladora</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Recicladora Huachipa SAC / Chatarrería"
                    value={comprador}
                    onChange={(e) => setComprador(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">N° Ticket / Recibo de Pesaje</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. T-00452 / 1029"
                    value={ticketNumero}
                    onChange={(e) => setTicketNumero(e.target.value)}
                  />
                </div>
              </div>

              {/* Adjuntar Foto del Ticket */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Foto del Ticket de Pesaje / Comprobante (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}>
                    <Camera size={16} />
                    <span>{sustentoFile ? 'Cambiar Foto / Archivo' : 'Subir Ticket / Comprobante'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {sustentoNombre && (
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '600' }}>
                      ✓ {sustentoNombre}
                    </span>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Observaciones / Detalle adicional</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Ej. Cartones acumulados de recepción de mercadería y embalajes del almacén..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

              {/* Banner informativo de ingreso a caja */}
              <div style={{
                padding: '0.85rem 1rem',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <DollarSign size={20} color="#15803d" style={{ flexShrink: 0 }} />
                <span>
                  Al registrar, este importe de <strong>S/ {parseFloat(montoTotal || 0).toFixed(2)}</strong> se sumará en tiempo real al <strong>Saldo Disponible de Caja Chica</strong> a nombre de <strong>{currentUser?.nombres} {currentUser?.apellidos}</strong>.
                </span>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
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
                  className="btn btn-primary"
                  disabled={isSubmitting || !montoTotal || parseFloat(montoTotal) <= 0}
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
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar e Ingresar a Caja'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLE DE VENTA */}
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
            maxWidth: '500px',
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

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>
                      Importe Ingresado a Caja Chica
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#047857' }}>
                      S/ {Number(selectedDetalle.monto).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                      {p.peso_kg > 0 ? `${p.peso_kg} Kg de ${p.material || 'Cartón'}` : p.material || 'Cartón'}
                      {p.precio_kg > 0 ? ` @ S/ ${Number(p.precio_kg).toFixed(2)} / Kg` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Fecha:</span>
                      <div style={{ fontWeight: '600' }}>{new Date(selectedDetalle.created_at).toLocaleDateString('es-PE')}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Registrado por:</span>
                      <div style={{ fontWeight: '600' }}>{selectedDetalle.solicitante_nombre}</div>
                    </div>
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
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: '700' }}>Notas:</span>
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
                    {isAdmin && selectedDetalle.estado !== 'ANULADO' && (
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

      {/* MODAL VISUALIZADOR DE FOTO EN PANTALLA COMPLETA */}
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
