import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Check, 
  AlertCircle, 
  Power,
  Lock,
  X
} from 'lucide-react';

const TODOS_LOS_ROLES = [
  { id: 'SYSADMIN', label: 'SYSADMIN', desc: 'Gestión maestro de DNIs, roles y parámetros del sistema' },
  { id: 'ADMINISTRADOR', label: 'ADMINISTRADOR', desc: 'Módulo exclusivo de aprobación de gastos y arqueo' },
  { id: 'SOLICITANTE', label: 'SOLICITANTE', desc: 'Registro de solicitudes y rendición con comprobantes' },
  { id: 'USUARIO', label: 'USUARIO', desc: 'Consulta de balances, historial y reportes' }
];

export function MaestroDni({ currentUser, usuarios, onSaveUsuario, onToggleActivo }) {
  const isSysadmin = currentUser?.roles?.includes('SYSADMIN');

  if (!isSysadmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '560px', margin: '2rem auto' }}>
        <Lock size={36} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
        <h2 style={{ color: '#0f172a', fontSize: '1.35rem', marginBottom: '0.4rem' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Solo los usuarios con rol <strong>SYSADMIN</strong> pueden gestionar el maestro de personal.
        </p>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['SOLICITANTE']);
  const [activo, setActivo] = useState(true);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setDni('');
    setNombres('');
    setApellidos('');
    setCorreo('');
    setTelefono('');
    setSelectedRoles(['SOLICITANTE']);
    setActivo(true);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setDni(user.dni);
    setNombres(user.nombres);
    setApellidos(user.apellidos);
    setCorreo(user.correo || '');
    setTelefono(user.telefono || '');
    setSelectedRoles([...user.roles]);
    setActivo(user.activo);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleRoleToggle = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length === 1) {
        setErrorMsg('El colaborador debe tener al menos 1 rol asignado.');
        return;
      }
      setSelectedRoles(selectedRoles.filter(r => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
    setErrorMsg('');
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanDni = dni.trim();
    if (!cleanDni || cleanDni.length < 8) {
      setErrorMsg('El DNI debe tener al menos 8 dígitos.');
      return;
    }

    if (!nombres.trim() || !apellidos.trim()) {
      setErrorMsg('Nombres y apellidos son obligatorios.');
      return;
    }

    if (selectedRoles.length === 0) {
      setErrorMsg('Debe seleccionar al menos un rol.');
      return;
    }

    if (!editingUser) {
      const existe = usuarios.find(u => u.dni === cleanDni);
      if (existe) {
        setErrorMsg(`Ya existe un colaborador con el DNI ${cleanDni}.`);
        return;
      }
    }

    try {
      await onSaveUsuario({
        dni: cleanDni,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        roles: selectedRoles,
        activo
      });
      setShowModal(false);
    } catch (err) {
      setErrorMsg('Error al guardar: ' + err.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      u.dni.toLowerCase().includes(q) ||
      u.nombres.toLowerCase().includes(q) ||
      u.apellidos.toLowerCase().includes(q) ||
      u.roles.some(r => r.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Encabezado */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="#0f172a" />
            <span>Maestro de DNI y Asignación de Roles</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Gestión de usuarios y asignación multi-rol
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.15rem' }}
        >
          <UserPlus size={16} />
          <span>Registrar Nuevo DNI</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar por DNI, nombres o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-panel" style={{ padding: '0.75rem' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Colaborador</th>
                <th>Contacto</th>
                <th>Roles Asignados (Multi-rol)</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.dni}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                      {u.dni}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      {u.nombres} {u.apellidos}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.correo || '-'}
                    </div>
                    {u.telefono && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                        Tel: {u.telefono}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {u.roles.map((r) => (
                        <span 
                          key={r} 
                          className={`badge ${
                            r === 'SYSADMIN' ? 'badge-sysadmin' :
                            r === 'ADMINISTRADOR' ? 'badge-admin' :
                            r === 'SOLICITANTE' ? 'badge-solicitante' : 'badge-usuario'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge-aprobado' : 'badge-rechazado'}`}>
                      {u.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => onToggleActivo(u.dni)}
                        className={`btn ${u.activo ? 'btn-ghost' : 'btn-success'}`}
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                        title={u.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={14} color={u.activo ? '#dc2626' : '#059669'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#0f172a" />
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                  {editingUser ? `Editar Colaborador (${editingUser.dni})` : 'Registrar Colaborador en Maestro de DNI'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">DNI *</label>
                  <input
                    type="text"
                    maxLength={10}
                    disabled={Boolean(editingUser)}
                    className="form-input"
                    placeholder="8 dígitos"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombres"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Apellidos"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Móvil"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="correo@empresa.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              {/* ASIGNACIÓN DE ROLES */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                margin: '1rem 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, color: '#0f172a' }}>
                    Asignación de Roles (Permite Múltiples) *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    {selectedRoles.length} seleccionado(s)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {TODOS_LOS_ROLES.map((rol) => {
                    const isChecked = selectedRoles.includes(rol.id);
                    return (
                      <div
                        key={rol.id}
                        onClick={() => handleRoleToggle(rol.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isChecked ? '#ffffff' : '#f8fafc',
                          border: `1px solid ${isChecked ? '#0f172a' : '#e2e8f0'}`,
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '3px',
                          border: `2px solid ${isChecked ? '#0f172a' : '#94a3b8'}`,
                          background: isChecked ? '#0f172a' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '0.825rem', color: '#0f172a' }}>
                            {rol.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {rol.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="chkActivo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0f172a' }}
                />
                <label htmlFor="chkActivo" style={{ fontSize: '0.825rem', color: '#0f172a', cursor: 'pointer' }}>
                  Usuario Habilitado para acceder al sistema
                </label>
              </div>

              {errorMsg && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-text)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
