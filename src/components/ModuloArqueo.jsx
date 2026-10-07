import React, { useState } from 'react';
import { Wallet, TrendingDown, Clock, CheckCircle2, Layers, DollarSign, Edit3, Check, Eye, XCircle, AlertCircle, History } from 'lucide-react';
import { playNotificationSound } from '../lib/audioNotifier';

export function ModuloArqueo({ cajaFondo, solicitudes, currentUser, onUpdateEstado, onAsignarFondo, onReponerFondo }) {
  const montoTotal = Number(cajaFondo?.monto_total || 5000);
  const montoDisponible = Number(cajaFondo?.monto_disponible || 0);
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR') || currentUser?.roles?.includes('SYSADMIN');
  const isCajero = currentUser?.roles?.includes('USUARIO');
  
  const [isEditingFondo, setIsEditingFondo] = useState(false);
  const [nuevoFondo, setNuevoFondo] = useState(montoTotal);
  const [isReponiendo, setIsReponiendo] = useState(false);
  const [montoReponer, setMontoReponer] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [filtroBandeja, setFiltroBandeja] = useState('APROBADO'); // 'APROBADO' | 'PENDIENTE' | 'RECHAZADO' | 'HISTORIAL' | 'TODOS'

  const getMontoEntrega = (sol) => {
    if (sol.estado === 'POR_REEMBOLSAR') {
      let lista = [];
      try {
        lista = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
      } catch (e) {
        lista = [];
      }
      if (Array.isArray(lista)) {
        const totalRendido = lista.reduce((sum, c) => sum + Number(c.monto || 0), 0);
        const adelanto = Number(sol.monto || 0);
        return Math.max(0, Number((totalRendido - adelanto).toFixed(2)));
      }
      return 0;
    }
    return Number(sol.monto || 0);
  };

  // Consideramos pagados los que están en estado PAGADO, POR_RENDIR o RENDIDO (para arqueo egresos)
  const totalPagado = solicitudes
    .filter(s => s.estado === 'PAGADO' || s.estado === 'POR_RENDIR' || s.estado === 'RENDIDO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const totalPendienteOAprobado = solicitudes
    .filter(s => s.estado === 'PENDIENTE' || s.estado === 'APROBADO' || s.estado === 'POR_REEMBOLSAR' || s.estado === 'PENDIENTE_REEMBOLSO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const porcentajeConsumido = Math.min(100, Math.round(((montoTotal - montoDisponible) / montoTotal) * 100));

  const categoriasMap = {};
  solicitudes.filter(s => s.estado === 'PAGADO' || s.estado === 'POR_RENDIR' || s.estado === 'RENDIDO').forEach(s => {
    const cat = s.categoria.replace(/_/g, ' ');
    if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, count: 0 };
    categoriasMap[cat].total += Number(s.monto || 0);
    categoriasMap[cat].count += 1;
  });

  const solicitudesAprobadas = solicitudes.filter(s => s.estado === 'APROBADO' || s.estado === 'POR_REEMBOLSAR');
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_REEMBOLSO');
  const solicitudesRechazadas = solicitudes.filter(s => s.estado === 'RECHAZADO');
  const solicitudesHistorial = solicitudes.filter(s => ['POR_RENDIR', 'RENDIDO', 'PAGADO'].includes(s.estado));

  const solicitudesFiltradasBandeja = solicitudes.filter(s => {
    if (filtroBandeja === 'APROBADO') return s.estado === 'APROBADO' || s.estado === 'POR_REEMBOLSAR';
    if (filtroBandeja === 'PENDIENTE') return s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_REEMBOLSO';
    if (filtroBandeja === 'RECHAZADO') return s.estado === 'RECHAZADO';
    if (filtroBandeja === 'HISTORIAL') return ['POR_RENDIR', 'RENDIDO', 'PAGADO'].includes(s.estado);
    return true; // TODOS
  });

  const handleGuardarFondo = async () => {
    if (nuevoFondo < 0) return alert('El monto no puede ser negativo.');
    await onAsignarFondo(nuevoFondo);
    setIsEditingFondo(false);
    playNotificationSound('success');
  };

  const handleGuardarRepocision = async () => {
    try {
      if (montoReponer <= 0) return alert('El monto a reponer debe ser mayor a 0');
      await onReponerFondo(montoReponer);
      setIsReponiendo(false);
      playNotificationSound('success');
    } catch (e) {
      alert('Error reponiendo fondo');
    }
  };

  const handleAbonar = async (sol) => {
    const isReembolso = sol.estado === 'POR_REEMBOLSAR';
    const montoAEntregar = getMontoEntrega(sol);

    if (montoDisponible < montoAEntregar) {
      alert('⚠️ Fondos insuficientes en la Caja Chica para realizar este desembolso.');
      return;
    }

    const confirmMsg = isReembolso
      ? `¿Confirmas la entrega del REEMBOLSO de S/ ${montoAEntregar.toFixed(2)} a ${sol.solicitante_nombre}?`
      : `¿Confirmas la entrega de S/ ${montoAEntregar.toFixed(2)} a ${sol.solicitante_nombre}?`;

    if (!window.confirm(confirmMsg)) return;

    setProcessingId(sol.id);
    try {
      const nuevoEstado = isReembolso ? 'RENDIDO' : 'POR_RENDIR';
      const obs = isReembolso ? 'Reembolso por exceso entregado en efectivo' : '';
      await onUpdateEstado(sol.id, nuevoEstado, obs);
      playNotificationSound('success');
    } catch (err) {
      alert('Error al entregar dinero: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      {/* Asignación de Fondos (Solo Admin) */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid var(--primary-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={18} /> Gestión de Presupuesto Asignado
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Asigna el tope máximo del fondo fijo para el Cajero.</p>
            </div>
            {isEditingFondo ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600' }}>Nuevo Tope:</span>
                <div style={{ position: 'relative', width: '130px' }}>
                  <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                    S/
                  </span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '2rem', paddingRight: '0.5rem', height: '36px', margin: 0 }}
                    value={nuevoFondo}
                    onChange={(e) => setNuevoFondo(e.target.value)}
                  />
                </div>
                <button className="btn btn-success" onClick={handleGuardarFondo} style={{ padding: '0 1rem', height: '36px' }}>
                  Guardar Tope
                </button>
                <button className="btn btn-ghost" onClick={() => { setIsEditingFondo(false); setNuevoFondo(montoTotal); }} style={{ padding: '0 0.75rem', height: '36px' }}>
                  Cancelar
                </button>
              </div>
            ) : isReponiendo ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600' }}>Monto a Reponer:</span>
                <div style={{ position: 'relative', width: '130px' }}>
                  <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                    S/
                  </span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '2rem', paddingRight: '0.5rem', height: '36px', margin: 0 }}
                    value={montoReponer}
                    onChange={(e) => setMontoReponer(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleGuardarRepocision} style={{ padding: '0 1rem', height: '36px' }}>
                  Confirmar Reposición
                </button>
                <button className="btn btn-ghost" onClick={() => setIsReponiendo(false)} style={{ padding: '0 0.75rem', height: '36px' }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => { setMontoReponer((montoTotal - montoDisponible).toFixed(2)); setIsReponiendo(true); }}>
                  Reponer Saldo
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditingFondo(true)}>
                  <Edit3 size={16} /> Modificar Tope de Caja
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tarjetas Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            <Wallet size={22} />
          </div>
          <div>
            <div className="stat-value">S/ {montoTotal.toFixed(2)}</div>
            <div className="stat-label">Fondo Fijo Asignado</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">S/ {montoDisponible.toFixed(2)}</div>
            <div className="stat-label">Saldo Disponible en Caja</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <div className="stat-value">S/ {totalPagado.toFixed(2)}</div>
            <div className="stat-label">Gastos Pagados / Entregados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">S/ {totalPendienteOAprobado.toFixed(2)}</div>
            <div className="stat-label">Comprometido (Pendiente/Aprob.)</div>
          </div>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>
              Estado del Presupuesto de Caja Chica
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Consumido: {porcentajeConsumido}% del fondo asignado
            </div>
          </div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: porcentajeConsumido > 75 ? '#dc2626' : porcentajeConsumido > 40 ? '#d97706' : '#059669'
          }}>
            {porcentajeConsumido}%
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '8px',
          background: '#f1f5f9',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${porcentajeConsumido}%`,
            height: '100%',
            background: porcentajeConsumido > 75 ? '#dc2626' : '#0f172a',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease-out'
          }} />
        </div>
      </div>

      {/* Bandeja de Entregas y Abonos (Para Cajero y Administrativos) */}
      {(isCajero || isAdmin) && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Bandeja de Entregas y Abonos</h3>
            </div>

            {/* Pestañas de Filtro */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${filtroBandeja === 'APROBADO' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFiltroBandeja('APROBADO')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Por Abonar</span>
                <span style={{ 
                  background: filtroBandeja === 'APROBADO' ? 'rgba(255,255,255,0.25)' : '#ecfdf5', 
                  color: filtroBandeja === 'APROBADO' ? '#fff' : '#059669',
                  padding: '1px 6px', 
                  borderRadius: '999px', 
                  fontWeight: '700', 
                  fontSize: '0.75rem' 
                }}>
                  {solicitudesAprobadas.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${filtroBandeja === 'PENDIENTE' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFiltroBandeja('PENDIENTE')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Pendientes</span>
                <span style={{ 
                  background: filtroBandeja === 'PENDIENTE' ? 'rgba(255,255,255,0.25)' : '#fffbeb', 
                  color: filtroBandeja === 'PENDIENTE' ? '#fff' : '#d97706',
                  padding: '1px 6px', 
                  borderRadius: '999px', 
                  fontWeight: '700', 
                  fontSize: '0.75rem' 
                }}>
                  {solicitudesPendientes.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${filtroBandeja === 'RECHAZADO' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFiltroBandeja('RECHAZADO')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Rechazados</span>
                <span style={{ 
                  background: filtroBandeja === 'RECHAZADO' ? 'rgba(255,255,255,0.25)' : '#fef2f2', 
                  color: filtroBandeja === 'RECHAZADO' ? '#fff' : '#dc2626',
                  padding: '1px 6px', 
                  borderRadius: '999px', 
                  fontWeight: '700', 
                  fontSize: '0.75rem' 
                }}>
                  {solicitudesRechazadas.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${filtroBandeja === 'HISTORIAL' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFiltroBandeja('HISTORIAL')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Historial Entregados</span>
                <span style={{ 
                  background: filtroBandeja === 'HISTORIAL' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', 
                  color: filtroBandeja === 'HISTORIAL' ? '#fff' : '#475569',
                  padding: '1px 6px', 
                  borderRadius: '999px', 
                  fontWeight: '700', 
                  fontSize: '0.75rem' 
                }}>
                  {solicitudesHistorial.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${filtroBandeja === 'TODOS' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFiltroBandeja('TODOS')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Todos</span>
                <span style={{ 
                  background: filtroBandeja === 'TODOS' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', 
                  color: filtroBandeja === 'TODOS' ? '#fff' : '#475569',
                  padding: '1px 6px', 
                  borderRadius: '999px', 
                  fontWeight: '700', 
                  fontSize: '0.75rem' 
                }}>
                  {solicitudes.length}
                </span>
              </button>
            </div>
          </div>

          {solicitudesFiltradasBandeja.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              {filtroBandeja === 'APROBADO' && 'No hay solicitudes aprobadas pendientes de pago o entrega de dinero.'}
              {filtroBandeja === 'PENDIENTE' && 'No hay solicitudes pendientes de aprobación.'}
              {filtroBandeja === 'RECHAZADO' && 'No hay solicitudes rechazadas.'}
              {filtroBandeja === 'HISTORIAL' && 'No hay entregas registradas en el historial.'}
              {filtroBandeja === 'TODOS' && 'No se encontraron solicitudes.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Solicitante</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradasBandeja.map(sol => (
                    <tr key={sol.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{sol.codigo}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{sol.solicitante_nombre}</div>
                        {sol.aprobado_por_nombre ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Aprobado por: {sol.aprobado_por_nombre}</div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Fecha: {sol.fecha || new Date(sol.created_at).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>{sol.motivo}</div>
                        {sol.categoria && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                              {sol.categoria.replace(/_/g, ' ')}
                            </span>
                            {sol.centro_costo && (
                              <span style={{ fontSize: '0.7rem', color: '#0369a1', fontFamily: 'monospace', fontWeight: '700' }}>
                                [{sol.centro_costo}]
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {sol.estado === 'POR_REEMBOLSAR' ? (
                          <div>
                            <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '1.1rem' }}>
                              S/ {getMontoEntrega(sol).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Reembolso (Adelanto: S/ {Number(sol.monto).toFixed(2)})
                            </div>
                          </div>
                        ) : sol.estado === 'PENDIENTE_REEMBOLSO' ? (
                          <div>
                            <div style={{ fontWeight: '800', color: '#b45309', fontSize: '1.05rem' }}>
                              S/ {Number(sol.monto).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#b45309' }}>
                              Rendición con exceso
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>
                            S/ {Number(sol.monto).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td>
                        {sol.estado === 'APROBADO' && (
                          <span className="badge badge-aprobado" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> Listo para Abonar
                          </span>
                        )}
                        {sol.estado === 'POR_REEMBOLSAR' && (
                          <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> Listo para Reembolso
                          </span>
                        )}
                        {sol.estado === 'PENDIENTE' && (
                          <span className="badge badge-pendiente" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} /> Pendiente de Aprobación
                          </span>
                        )}
                        {sol.estado === 'PENDIENTE_REEMBOLSO' && (
                          <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} /> Reembolso en Revisión
                          </span>
                        )}
                        {sol.estado === 'RECHAZADO' && (
                          <div>
                            <span className="badge badge-rechazado" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <XCircle size={13} /> Rechazado
                            </span>
                            {sol.observaciones_aprobador && (
                              <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', maxWidth: '240px', wordBreak: 'break-word', background: '#fef2f2', padding: '3px 6px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                                <strong>Motivo:</strong> {sol.observaciones_aprobador}
                              </div>
                            )}
                          </div>
                        )}
                        {sol.estado === 'POR_RENDIR' && (
                          <span className="badge badge-aprobado" style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <History size={13} /> Dinero Entregado
                          </span>
                        )}
                        {sol.estado === 'RENDIDO' && (
                          <span className="badge badge-aprobado" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> Rendido (Liquidado)
                          </span>
                        )}
                        {sol.estado === 'PAGADO' && (
                          <span className="badge badge-aprobado" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Check size={13} /> Pagado
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {(sol.estado === 'APROBADO' || sol.estado === 'POR_REEMBOLSAR') ? (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleAbonar(sol)}
                            disabled={processingId === sol.id}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <Check size={16} /> {sol.estado === 'POR_REEMBOLSAR' ? 'Entregar Reembolso' : 'Entregar Dinero'}
                          </button>
                        ) : (sol.estado === 'PENDIENTE' || sol.estado === 'PENDIENTE_REEMBOLSO') ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Requiere visto bueno de Admin
                          </span>
                        ) : sol.estado === 'RECHAZADO' ? (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '500' }}>
                            Denegado
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Completado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Desglose por Categorías */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <Layers size={18} color="#0f172a" />
          <h3 style={{ fontSize: '1.05rem', color: '#0f172a' }}>
            Distribución de Gastos (Pagados)
          </h3>
        </div>

        {Object.keys(categoriasMap).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-faint)' }}>
            Sin movimientos registrados aún.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            {Object.entries(categoriasMap).map(([cat, data]) => (
              <div 
                key={cat}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {cat}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.15rem' }}>
                  S/ {data.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                  {data.count} movimiento(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
