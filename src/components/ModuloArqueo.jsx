import React from 'react';
import { Wallet, TrendingDown, Clock, CheckCircle2, AlertCircle, PieChart, Layers } from 'lucide-react';

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

  // Agrupación por categoría
  const categoriasMap = {};
  solicitudes.forEach(s => {
    const cat = s.categoria.replace(/_/g, ' ');
    if (!categoriasMap[cat]) categoriasMap[cat] = { total: 0, count: 0 };
    categoriasMap[cat].total += Number(s.monto || 0);
    categoriasMap[cat].count += 1;
  });

  return (
    <div>
      {/* Tarjetas Métricas Principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8' }}>
            <Wallet size={26} />
          </div>
          <div>
            <div className="stat-value">S/ {montoTotal.toFixed(2)}</div>
            <div className="stat-label">Fondo Fijo Asignado</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div className="stat-value">S/ {montoDisponible.toFixed(2)}</div>
            <div className="stat-label">Saldo Disponible en Caja</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <TrendingDown size={26} />
          </div>
          <div>
            <div className="stat-value">S/ {totalAprobado.toFixed(2)}</div>
            <div className="stat-label">Gastos Egresados / Rendidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={26} />
          </div>
          <div>
            <div className="stat-value">S/ {totalPendiente.toFixed(2)}</div>
            <div className="stat-label">En Trámite de Aprobación</div>
          </div>
        </div>
      </div>

      {/* Barra de Progreso del Fondo */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
              Estado del Presupuesto de Caja Chica
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Consumido: {porcentajeConsumido}% del fondo inicial
            </div>
          </div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: porcentajeConsumido > 75 ? '#ef4444' : porcentajeConsumido > 40 ? '#f59e0b' : '#10b981'
          }}>
            {porcentajeConsumido}%
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '12px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${porcentajeConsumido}%`,
            height: '100%',
            background: porcentajeConsumido > 75 
              ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
              : 'linear-gradient(90deg, #0284c7, #10b981)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>

      {/* Desglose por Categorías */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Layers size={20} color="var(--primary-light)" />
          <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>
            Distribución de Gastos por Categoría
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {Object.entries(categoriasMap).map(([cat, data]) => (
            <div 
              key={cat}
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {cat}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginBottom: '0.2rem' }}>
                S/ {data.total.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                {data.count} movimiento(s)
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
