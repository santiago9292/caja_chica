import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  Check, 
  X, 
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function MaestroCategorias({ 
  currentUser, 
  categorias = [], 
  onSaveCategoria, 
  onToggleActivo,
  onDeleteCategoria
}) {
  const isSysadmin = currentUser?.roles?.includes('SYSADMIN');

  if (!isSysadmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '560px', margin: '2rem auto' }}>
        <Lock size={36} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
        <h2 style={{ color: '#0f172a', fontSize: '1.35rem', marginBottom: '0.4rem' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Solo los usuarios con rol <strong>SYSADMIN</strong> pueden gestionar el maestro de categorías de gasto.
        </p>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [id, setId] = useState('');
  const [centroCosto, setCentroCosto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  const categoriasFiltradas = categorias.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.centro_costo && c.centro_costo.toLowerCase().includes(q)) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(q))
    );
  });

  const totalActivas = categorias.filter(c => c.activo).length;
  const totalInactivas = categorias.filter(c => !c.activo).length;

  const handleOpenCreate = () => {
    setEditingCat(null);
    setNombre('');
    setId('');
    setCentroCosto('CC-OPERACIONES');
    setDescripcion('');
    setActivo(true);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setNombre(cat.nombre);
    setId(cat.id);
    setCentroCosto(cat.centro_costo || '');
    setDescripcion(cat.descripcion || '');
    setActivo(cat.activo);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleNombreChange = (val) => {
    setNombre(val);
    // Si estamos creando una nueva, auto-generar el ID en mayúsculas
    if (!editingCat) {
      const generated = val
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar tildes
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      setId(generated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    if (!id.trim()) {
      setErrorMsg('El código identificador es obligatorio.');
      return;
    }

    if (!centroCosto.trim()) {
      setErrorMsg('El centro de costos es obligatorio.');
      return;
    }

    // Si es nueva, verificar que el código no esté duplicado
    if (!editingCat && categorias.some(c => c.id === id.trim())) {
      setErrorMsg('Ya existe una categoría con ese código identificador.');
      return;
    }

    try {
      await onSaveCategoria({
        id: id.trim().toUpperCase(),
        nombre: nombre.trim(),
        centro_costo: centroCosto.trim().toUpperCase(),
        descripcion: descripcion.trim(),
        activo
      });
      setShowModal(false);
    } catch (err) {
      setErrorMsg('Error al guardar la categoría: ' + err.message);
    }
  };

  return (
    <div>
      {/* Encabezado Principal */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={22} color="#2563eb" />
            <span>Maestro de Categorías de Gasto</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Administración centralizada de categorías permitidas en solicitudes de Caja Chica
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
        >
          <Plus size={16} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="stat-value">{categorias.length}</div>
            <div className="stat-label">Categorías Totales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-value">{totalActivas}</div>
            <div className="stat-label">Disponibles / Activas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="stat-value">{totalInactivas}</div>
            <div className="stat-label">Inactivas</div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar por nombre, código o descripción de categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Categorías */}
      <div className="glass-panel" style={{ padding: '0.75rem' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Código ID</th>
                <th>Nombre de la Categoría</th>
                <th style={{ width: '170px' }}>Centro de Costos</th>
                <th>Descripción / Alcance</th>
                <th style={{ width: '100px' }}>Estado</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No se encontraron categorías registradas.
                  </td>
                </tr>
              ) : (
                categoriasFiltradas.map((cat) => (
                  <tr key={cat.id} style={{ opacity: cat.activo ? 1 : 0.6 }}>
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: '700', 
                        background: '#f1f5f9', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        color: '#0f172a',
                        fontSize: '0.82rem'
                      }}>
                        {cat.id}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{cat.nombre}</strong>
                    </td>
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: '700', 
                        background: '#e0f2fe', 
                        color: '#0369a1',
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.78rem'
                      }}>
                        {cat.centro_costo || '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {cat.descripcion || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cat.activo ? 'badge-aprobado' : 'badge-rechazado'}`}>
                        {cat.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="btn btn-secondary btn-icon"
                          style={{ padding: '0.4rem', width: '32px', height: '32px' }}
                          title="Editar Categoría"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => onToggleActivo(cat.id)}
                          className="btn btn-secondary btn-icon"
                          style={{ 
                            padding: '0.4rem', 
                            width: '32px', 
                            height: '32px',
                            color: cat.activo ? '#dc2626' : '#16a34a'
                          }}
                          title={cat.activo ? 'Desactivar Categoría' : 'Activar Categoría'}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                {editingCat ? 'Editar Categoría' : 'Nueva Categoría de Gasto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#dc2626', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre de la Categoría *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Combustible / Peajes"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Código Identificador *
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                    (Clave única en mayúsculas)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EJ: COMBUSTIBLE_PEAJES"
                  value={id}
                  onChange={(e) => setId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  disabled={Boolean(editingCat)} // No cambiar ID de existentes para mantener integridad
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  required
                />
                {editingCat && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    El código no se puede modificar una vez creado para no afectar registros existentes.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Centro de Costos (CECO) *
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                    (Código contable o área presupuestal)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EJ: CC-OPERACIONES, ADM-101..."
                  value={centroCosto}
                  onChange={(e) => setCentroCosto(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción / Alcance</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Describe qué tipo de comprobantes o consumos aplican a este rubro..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="checkbox"
                  id="cat_activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="cat_activo" style={{ fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer', margin: 0 }}>
                  Categoría Activa (Visible para solicitar adelantos)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Check size={16} />
                  <span>{editingCat ? 'Guardar Cambios' : 'Crear Categoría'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
