import React, { useState } from 'react';
import { 
  Users, 
  Tag, 
  ShieldCheck, 
  Lock
} from 'lucide-react';
import { MaestroDni } from './MaestroDni';
import { MaestroCategorias } from './MaestroCategorias';
import { ModuloAuditoria } from './ModuloAuditoria';

export function ModuloAdministracion({
  currentUser,
  solicitudes = [],
  usuarios,
  onSaveUsuario,
  onToggleActivo,
  categorias,
  onSaveCategoria,
  onToggleCategoriaActiva,
  onDeleteCategoria,
  auditLogs = [],
  onRefreshAuditoria,
  initialSubTab = 'DNI'
}) {
  const isSysadmin = currentUser?.roles?.includes('SYSADMIN');
  const isAdmin = currentUser?.roles?.includes('ADMINISTRADOR');

  // Solo Sysadmin o Administrador pueden acceder a la sección de administración
  if (!isSysadmin && !isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '560px', margin: '2rem auto' }}>
        <Lock size={36} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
        <h2 style={{ color: '#0f172a', fontSize: '1.35rem', marginBottom: '0.4rem' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          La sección de Administración está reservada para usuarios con rol <strong>SYSADMIN</strong> o <strong>ADMINISTRADOR</strong>.
        </p>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  return (
    <div>
      {/* Selector de Sub-Pestañas Superiores de Administración */}
      <div 
        className="nav-tabs-container"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
          paddingBottom: '0.35rem',
          overflowX: 'auto'
        }}
      >
        {/* Pestaña 1: Maestro DNIs */}
        <button
          onClick={() => setActiveSubTab('DNI')}
          className="btn btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: activeSubTab === 'DNI' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'DNI' ? '#0f172a' : '#64748b',
            boxShadow: activeSubTab === 'DNI' ? 'var(--shadow-sm)' : 'none',
            borderBottom: activeSubTab === 'DNI' ? '3px solid #0284c7' : '3px solid transparent',
            fontSize: '0.875rem',
            fontWeight: activeSubTab === 'DNI' ? '700' : '600',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={16} color={activeSubTab === 'DNI' ? '#0284c7' : '#64748b'} />
          <span>Maestro DNIs & Personal</span>
          <span 
            className="badge" 
            style={{ 
              background: '#f1f5f9', 
              color: '#475569', 
              fontSize: '0.72rem', 
              padding: '0.1rem 0.45rem',
              marginLeft: '0.25rem' 
            }}
          >
            {usuarios?.length || 0}
          </span>
        </button>

        {/* Pestaña 2: Categorías de Gasto */}
        <button
          onClick={() => setActiveSubTab('CATEGORIAS')}
          className="btn btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: activeSubTab === 'CATEGORIAS' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'CATEGORIAS' ? '#0f172a' : '#64748b',
            boxShadow: activeSubTab === 'CATEGORIAS' ? 'var(--shadow-sm)' : 'none',
            borderBottom: activeSubTab === 'CATEGORIAS' ? '3px solid #0284c7' : '3px solid transparent',
            fontSize: '0.875rem',
            fontWeight: activeSubTab === 'CATEGORIAS' ? '700' : '600',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Tag size={16} color={activeSubTab === 'CATEGORIAS' ? '#0284c7' : '#64748b'} />
          <span>Categorías de Gasto</span>
          <span 
            className="badge" 
            style={{ 
              background: '#f1f5f9', 
              color: '#475569', 
              fontSize: '0.72rem', 
              padding: '0.1rem 0.45rem',
              marginLeft: '0.25rem' 
            }}
          >
            {categorias?.length || 0}
          </span>
        </button>

        {/* Pestaña 3: Auditoría & Trazabilidad */}
        <button
          onClick={() => setActiveSubTab('AUDITORIA')}
          className="btn btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: activeSubTab === 'AUDITORIA' ? '#ffffff' : 'transparent',
            color: activeSubTab === 'AUDITORIA' ? '#0f172a' : '#64748b',
            boxShadow: activeSubTab === 'AUDITORIA' ? 'var(--shadow-sm)' : 'none',
            borderBottom: activeSubTab === 'AUDITORIA' ? '3px solid #0284c7' : '3px solid transparent',
            fontSize: '0.875rem',
            fontWeight: activeSubTab === 'AUDITORIA' ? '700' : '600',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <ShieldCheck size={16} color={activeSubTab === 'AUDITORIA' ? '#0284c7' : '#64748b'} />
          <span>Auditoría & Trazabilidad</span>
          <span 
            className="badge" 
            style={{ 
              background: '#e0f2fe', 
              color: '#0369a1', 
              fontSize: '0.72rem', 
              padding: '0.1rem 0.45rem',
              fontWeight: '700',
              marginLeft: '0.25rem' 
            }}
          >
            {solicitudes?.length || 0}
          </span>
        </button>
      </div>

      {/* Contenido de la Sub-Pestaña Activa */}
      {activeSubTab === 'DNI' && (
        <MaestroDni
          currentUser={currentUser}
          usuarios={usuarios}
          onSaveUsuario={onSaveUsuario}
          onToggleActivo={onToggleActivo}
        />
      )}

      {activeSubTab === 'CATEGORIAS' && (
        <MaestroCategorias
          currentUser={currentUser}
          categorias={categorias}
          onSaveCategoria={onSaveCategoria}
          onToggleActivo={onToggleCategoriaActiva}
          onDeleteCategoria={onDeleteCategoria}
        />
      )}

      {activeSubTab === 'AUDITORIA' && (
        <ModuloAuditoria
          currentUser={currentUser}
          solicitudes={solicitudes}
          auditLogs={auditLogs}
          onRefresh={onRefreshAuditoria}
        />
      )}
    </div>
  );
}
