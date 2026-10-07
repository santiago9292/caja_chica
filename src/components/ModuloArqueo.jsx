import React, { useState } from 'react';
import { Wallet, TrendingDown, Clock, CheckCircle2, Layers, DollarSign, Edit3, Check, Eye } from 'lucide-react';
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

  // Consideramos pagados los que están en estado PAGADO, POR_RENDIR o RENDIDO (para arqueo egresos)
  const totalPagado = solicitudes
    .filter(s => s.estado === 'PAGADO' || s.estado === 'POR_RENDIR' || s.estado === 'RENDIDO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const totalPendienteOAprobado = solicitudes
    .filter(s => s.estado === 'PENDIENTE' || s.estado === 'APROBADO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const porcentajeConsumido = Math.min(100, Math.round(((montoTotal - montoDisponible) / montoTotal) * 100));

  const categoriasMap = {};
  solicitudes.filter(s => s.estado === 'PAGADO' || s.estado === 'POR_RENDIR' || s.estado === 'RENDIDO').forEach(s => {
    const cat = s.categoria.replace(/_/g, ' ');
    if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, count: 0 };
    categoriasMap[cat].total += Number(s.monto || 0);
    categoriasMap[cat].count += 1;
  });

  const solicitudesAprobadas = solicitudes.filter(s => s.estado === 'APROBADO');

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
    if (montoDisponible < sol.monto) {
      alert('⚠️ Fondos insuficientes en la Caja Chica para realizar este abono.');
      return;
    }
    if (!window.confirm(`¿Confirmas la entrega de S/ ${sol.monto.toFixed(2)} a ${sol.solicitante_nombre}?`)) return;

    setProcessingId(sol.id);
    try {
      await onUpdateEstado(sol.id, 'POR_RENDIR', '');
      playNotificationSound('success');
    } catch (err) {
      alert('Error al abonar: ' + err.message);
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

      {/* Bandeja de Pagos (Solo para Cajero/Usuario) */}
      {isCajero && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <DollarSign size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Bandeja de Entregas y Abonos</h3>
            <span className="badge badge-aprobado" style={{ marginLeft: 'auto' }}>
              {solicitudesAprobadas.length} Por Abonar
            </span>
          </div>

          {solicitudesAprobadas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              No hay solicitudes aprobadas pendientes de pago.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Solicitante</th>
                    <th>Concepto</th>
                    <th>Monto a Entregar</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesAprobadas.map(sol => (
                    <tr key={sol.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{sol.codigo}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{sol.solicitante_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Aprobado por: {sol.aprobado_por_nombre}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{sol.motivo}</td>
                      <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>S/ {Number(sol.monto).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleAbonar(sol)}
                          disabled={processingId === sol.id}
                        >
                          <Check size={16} /> Entregar Dinero
                        </button>
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
