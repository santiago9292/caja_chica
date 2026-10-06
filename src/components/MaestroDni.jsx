import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  ShieldCheck, 
  CheckSquare, 
  Check, 
  X, 
  AlertCircle, 
  Power,
  Lock,
  Phone,
  Mail,
  User
} from 'lucide-react';

const TODOS_LOS_ROLES = [
  { id: 'SYSADMIN', label: 'SYSADMIN', desc: 'Control maestro de DNIs, roles y parámetros del sistema' },
  { id: 'ADMINISTRADOR', label: 'ADMINISTRADOR', desc: 'Módulo exclusivo de aprobación de gastos, arqueo y cierre' },
  { id: 'SOLICITANTE', label: 'SOLICITANTE', desc: 'Registro de solicitudes de fondos y rendición de comprobantes' },
  { id: 'USUARIO', label: 'USUARIO', desc: 'Consulta de balances, historial y reportes informativos' }
];

export function MaestroDni({ currentUser, usuarios, onSaveUsuario, onToggleActivo }) {
  const isSysadmin = currentUser?.roles?.includes('SYSADMIN');

  if (!isSysadmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <Lock size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Acceso Restringido al Maestro de DNI</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Solo los usuarios con el rol <strong style={{ color: '#c084fc' }}>SYSADMIN</strong> pueden gestionar el maestro de personal y asignar roles.
        </p>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null); // null o usuario objeto
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario del modal
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
        setErrorMsg('El usuario debe tener asignado al menos 1 rol.');
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
      setErrorMsg('Debe seleccionar al menos un rol para el usuario.');
      return;
    }

    // Verificar DNI duplicado si es nuevo
    if (!editingUser) {
      const existe = usuarios.find(u => u.dni === cleanDni);
      if (existe) {
        setErrorMsg(`Ya existe un usuario registrado con el DNI ${cleanDni}.`);
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
      {/* Encabezado del Maestro de DNI */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={26} color="var(--primary-light)" />
            <span>Maestro de DNI y Asignación de Roles</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Administración central de colaboradores y permisos multi-rol en tiempo real
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <UserPlus size={18} />
          <span>Registrar Nuevo DNI</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-faint)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por número de DNI, nombre, apellido o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
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
                    <span style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--primary-light)', fontSize: '0.95rem' }}>
                      {u.dni}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#fff' }}>
                      {u.nombres} {u.apellidos}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.correo || 'Sin correo'}
                    </div>
                    {u.telefono && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                        Tel: {u.telefono}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
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
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        title="Modificar datos o roles"
                      >
                        <Edit3 size={15} />
                        <span>Editar Roles</span>
                      </button>
                      <button
                        onClick={() => onToggleActivo(u.dni)}
                        className={`btn ${u.activo ? 'btn-ghost' : 'btn-success'}`}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        <Power size={15} color={u.activo ? '#ef4444' : '#10b981'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar Usuario con Asignación de Roles */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={22} color="var(--primary-light)" />
                <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>
                  {editingUser ? `Editar Colaborador (${editingUser.dni})` : 'Registrar Colaborador en Maestro de DNI'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
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
                  <label className="form-label">Nombres Completos *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Juan Carlos"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Pérez Rodríguez"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono / Móvil</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 998877665"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Corporativo</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@empresa.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              {/* ASIGNACIÓN DE MÚLTIPLES ROLES */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                margin: '1.25rem 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, color: '#38bdf8' }}>
                    Asignación de Roles (Permite Múltiples Roles) *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                    {selectedRoles.length} rol(es) marcado(s)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {TODOS_LOS_ROLES.map((rol) => {
                    const isChecked = selectedRoles.includes(rol.id);
                    return (
                      <div
                        key={rol.id}
                        onClick={() => handleRoleToggle(rol.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isChecked ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isChecked ? 'var(--primary-light)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `2px solid ${isChecked ? 'var(--primary-light)' : 'var(--text-faint)'}`,
                          background: isChecked ? 'var(--primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff' }}>
                            {rol.label}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {rol.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estado Activo / Inactivo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="chkActivo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="chkActivo" style={{ fontSize: '0.875rem', color: '#fff', cursor: 'pointer' }}>
                  Usuario Habilitado para inicio de sesión en Caja Chica
                </label>
              </div>

              {errorMsg && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Guardar Colaborador</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
