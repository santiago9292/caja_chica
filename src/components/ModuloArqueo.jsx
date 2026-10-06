import React from 'react';
import { Wallet, TrendingDown, Clock, CheckCircle2, Layers } from 'lucide-react';

export function ModuloArqueo({ cajaFondo, solicitudes }) {
  const montoTotal = Number(cajaFondo?.monto_total || 5000);
  const montoDisponible = Number(cajaFondo?.monto_disponible || 0);
  
  const totalAprobado = solicitudes
    .filter(s => s.estado === 'APROBADO')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const totalPendiente = solicitudes
    .filter(s => s.estado === 'PENDIENTE')
    .reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

  const porcentajeConsumido = Math.min(100, Math.round(((montoTotal - montoDisponible) / montoTotal) * 100));

  const categoriasMap = {};
  solicitudes.forEach(s => {
    const cat = s.categoria.replace(/_/g, ' ');
    if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, count: 0 };
    categoriasMap[cat].total += Number(s.monto || 0);
    categoriasMap[cat].count += 1;
  });

  return (
    <div>
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
            <div className="stat-value">S/ {totalAprobado.toFixed(2)}</div>
            <div className="stat-label">Gastos Egresados / Rendidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">S/ {totalPendiente.toFixed(2)}</div>
            <div className="stat-label">En Trámite de Aprobación</div>
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

      {/* Desglose por Categorías */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <Layers size={18} color="#0f172a" />
          <h3 style={{ fontSize: '1.05rem', color: '#0f172a' }}>
            Distribución de Gastos por Categoría
          </h3>
        </div>

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
      </div>

    </div>
  );
}
