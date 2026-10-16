import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Banknote, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  User,
  Users,
  Smartphone
} from 'lucide-react';
import { playNotificationSound } from '../lib/audioNotifier';

import { DEFAULT_CATEGORIAS, store } from '../lib/store';

const METODOS_DESTINO = [
  { id: 'YAPE', label: 'Yape', sublabel: 'Billetera Móvil (Celular)', placeholder: 'Ej. 987 654 321', isPhone: true, icon: '📱' },
  { id: 'PLIN', label: 'Plin', sublabel: 'Billetera Móvil (Celular)', placeholder: 'Ej. 987 654 321', isPhone: true, icon: '⚡' },
  { id: 'BCP', label: 'BCP', sublabel: 'Banco de Crédito del Perú', placeholder: 'Ej. 191-xxxxxxx-x-xx o CCI', isPhone: false, icon: '🏦' },
  { id: 'BBVA', label: 'BBVA', sublabel: 'BBVA Continental', placeholder: 'Ej. 0011-xxxx-xxxxxxxxxx o CCI', isPhone: false, icon: '🏦' },
  { id: 'INTERBANK', label: 'Interbank', sublabel: 'Interbank', placeholder: 'Ej. 200-xxxxxxxxx o CCI', isPhone: false, icon: '🏦' },
  { id: 'SCOTIABANK', label: 'Scotiabank', sublabel: 'Scotiabank Perú', placeholder: 'Ej. N° de cuenta o CCI', isPhone: false, icon: '🏦' },
  { id: 'BANCO_NACION', label: 'Banco de la Nación', sublabel: 'Banco de la Nación', placeholder: 'Ej. 04-xxx-xxxxxx o CCI', isPhone: false, icon: '🏛️' },
  { id: 'EFECTIVO_CAJA', label: 'Efectivo en Ventanilla / Caja', sublabel: 'Pago presencial', placeholder: 'Entrega física en efectivo', isPhone: false, icon: '💵' },
  { id: 'OTRO', label: 'Otro Banco / Medio', sublabel: 'Cualquier otra entidad', placeholder: 'Indique entidad y N° de cuenta o CCI', isPhone: false, icon: '💳' },
];

export function FormularioIngreso({ currentUser, onSubmitSolicitud, onSuccessTab, categorias = [], solicitudes = [] }) {
  const listaCategorias = (categorias && categorias.length > 0 ? categorias : DEFAULT_CATEGORIAS).filter(c => c.activo !== false);

  // Centros de costo disponibles únicos
  const centrosCostoDisponibles = Array.from(
    new Set(listaCategorias.map(c => c.centro_costo).filter(Boolean))
  );

  const [centroCosto, setCentroCosto] = useState('');
  
  // Categorías que pertenecen al centro de costo actual (o todas si no ha elegido)
  const categoriasDelCentro = centroCosto 
    ? listaCategorias.filter(c => !c.centro_costo || c.centro_costo === centroCosto)
    : listaCategorias;

  const [categoriaId, setCategoriaId] = useState('');

  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  // Destinatario del abono: 'A_MI' (por defecto) o 'TERCERO'
  const [destinatarioTipo, setDestinatarioTipo] = useState('A_MI');

  // Modalidad seleccionada para "A mí": 'EFECTIVO_CAJA', 'YAPE', 'PLIN' (ninguna preseleccionada)
  const [miModalidadAbono, setMiModalidadAbono] = useState('');

  // Número personal para "A mí" recordado en localStorage, perfil de usuario o solicitudes previas
  const [miNumeroAbono, setMiNumeroAbono] = useState(() => {
    if (!currentUser?.dni) return '';
    try {
      const local = localStorage.getItem(`caja_mi_numero_abono_${currentUser.dni}`);
      if (local) return local;
    } catch {}
    if (currentUser?.telefono) return currentUser.telefono;
    return '';
  });

  useEffect(() => {
    if (!currentUser?.dni) return;

    // Si ya tiene valor, no sobreescribir
    if (miNumeroAbono) return;

    // 1. Probar en localStorage del navegador actual
    try {
      const numGuardado = localStorage.getItem(`caja_mi_numero_abono_${currentUser.dni}`);
      if (numGuardado) {
        setMiNumeroAbono(numGuardado);
        return;
      }
    } catch {}

    // 2. Probar en el perfil del usuario (Supabase)
    if (currentUser?.telefono) {
      setMiNumeroAbono(currentUser.telefono);
      return;
    }

    // 3. Probar en la última solicitud registrada en la base de datos con Yape o Plin
    if (solicitudes && solicitudes.length > 0) {
      const ultimaSol = [...solicitudes]
        .filter(s => 
          s.solicitante_dni === currentUser.dni && 
          (s.abono_banco === 'YAPE' || s.abono_banco === 'PLIN') && 
          s.abono_cuenta_numero && 
          s.abono_cuenta_numero !== 'EFECTIVO_VENTANILLA'
        )
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];

      if (ultimaSol?.abono_cuenta_numero) {
        setMiNumeroAbono(ultimaSol.abono_cuenta_numero);
        try {
          localStorage.setItem(`caja_mi_numero_abono_${currentUser.dni}`, ultimaSol.abono_cuenta_numero);
        } catch {}
      }
    }
  }, [currentUser?.dni, currentUser?.telefono, solicitudes, miNumeroAbono]);

  // Datos para el abono cuando es a un tercero (tampoco preseleccionado)
  const [abonoBanco, setAbonoBanco] = useState('');
  const [abonoCuentaNumero, setAbonoCuentaNumero] = useState('');
  const [abonoTitular, setAbonoTitular] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');

  const handleCentroCostoChange = (newCC) => {
    setCentroCosto(newCC);
    setCategoriaId(''); // Forzar a que elija la categoría
  };

  const metodoSeleccionado = METODOS_DESTINO.find(m => m.id === abonoBanco) || METODOS_DESTINO[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('Por favor ingrese un monto válido mayor a 0.');
      return;
    }

    if (!centroCosto) {
      setErrorMsg('Por favor seleccione un Centro de Costo obligatorio.');
      return;
    }

    if (!categoriaId) {
      setErrorMsg('Por favor seleccione una Categoría del Gasto obligatoria.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('Por favor especifique el concepto o justificación del gasto.');
      return;
    }

    // Validaciones de abono según destinatario
    if (destinatarioTipo === 'A_MI') {
      if (!miModalidadAbono) {
        setErrorMsg('Por favor selecciona cómo deseas recibir el adelanto: Efectivo en Caja, Yape o Plin.');
        return;
      }
      if ((miModalidadAbono === 'YAPE' || miModalidadAbono === 'PLIN') && !miNumeroAbono.trim()) {
        setErrorMsg(`Por favor ingresa o confirma tu número celular de ${miModalidadAbono === 'PLIN' ? 'Plin' : 'Yape'} al que se te debe abonar.`);
        return;
      }
    } else {
      if (!abonoBanco) {
        setErrorMsg('Por favor seleccione el medio o entidad de abono del tercero.');
        return;
      }
      if (abonoBanco !== 'EFECTIVO_CAJA' && !abonoCuentaNumero.trim()) {
        setErrorMsg('Por favor indique a qué número se debe abonar lo solicitado al tercero (celular, cuenta bancaria o CCI).');
        return;
      }

      if (!abonoTitular.trim()) {
        setErrorMsg('Por favor especifique a nombre de qué tercero (persona o empresa) debe salir el abono.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const catObj = listaCategorias.find(c => c.id === categoriaId);
      const isTercero = destinatarioTipo === 'TERCERO';

      // Si es a mí y usó Yape o Plin, guardar su número personal en localStorage y en la nube (perfil de usuario)
      if (!isTercero && currentUser?.dni && (miModalidadAbono === 'YAPE' || miModalidadAbono === 'PLIN') && miNumeroAbono.trim()) {
        const numLimpio = miNumeroAbono.trim();
        try {
          localStorage.setItem(`caja_mi_numero_abono_${currentUser.dni}`, numLimpio);
        } catch {}
        store.guardarTelefonoUsuario(currentUser.dni, numLimpio);
      }

      const data = {
        tipo: 'ADELANTO_DINERO',
        solicitante_dni: currentUser.dni,
        solicitante_nombre: `${currentUser.nombres} ${currentUser.apellidos}`,
        monto: montoNum,
        motivo: motivo.trim(),
        categoria: catObj?.nombre || 'ADMINISTRACIÓN',
        centro_costo: centroCosto || catObj?.centro_costo || 'TRANS',
        // Datos de destino para el abono
        abono_destinatario_tipo: destinatarioTipo,
        abono_banco: isTercero ? abonoBanco : miModalidadAbono,
        abono_cuenta_numero: isTercero 
          ? (abonoBanco === 'EFECTIVO_CAJA' ? 'EFECTIVO_VENTANILLA' : abonoCuentaNumero.trim()) 
          : (miModalidadAbono === 'EFECTIVO_CAJA' ? 'EFECTIVO_VENTANILLA' : miNumeroAbono.trim()),
        abono_titular: isTercero 
          ? abonoTitular.trim() 
          : `${currentUser.nombres} ${currentUser.apellidos}`.trim(),
        // Al ser un adelanto puro, nace sin comprobantes físicos
        comprobante_tipo: null,
        comprobante_numero: null,
        comprobante_ruc_emisor: null,
        comprobante_razon_social: null,
        comprobante_fecha: null,
        comprobante_archivo_url: null,
        rendiciones: [] // Para guardar múltiples facturas después
      };

      const result = await onSubmitSolicitud(data);
      playNotificationSound('alert');
      setSuccessCode(result.codigo);
      
      setMonto('');
      setCentroCosto('');
      setCategoriaId('');
      setMotivo('');
      setDestinatarioTipo('A_MI');
      setMiModalidadAbono(''); // Dejar sin preselección para la siguiente
      setAbonoBanco(''); // Dejar sin preselección
      setAbonoCuentaNumero('');
      setAbonoTitular('');
    } catch (err) {
      setErrorMsg('Error al registrar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
      
      {/* Notificación de Éxito */}
      {successCode && (
        <div className="glass-panel" style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--success-text)', fontSize: '0.9rem' }}>
                Adelanto registrado con éxito
              </div>
              <div style={{ color: '#047857', fontSize: '0.78rem' }}>
                Código generado: <strong>{successCode}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', flex: '1' }}
              onClick={() => setSuccessCode('')}
            >
              Pedir Otro
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', flex: '1' }}
              onClick={onSuccessTab}
            >
              Ver Solicitudes
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        
        {/* Cabecera */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Banknote size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.2rem' }}>
              Nuevo Adelanto de Efectivo
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Solicitante: <strong>{currentUser?.nombres} {currentUser?.apellidos}</strong> (DNI: {currentUser?.dni})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">
                Monto (S/) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#475569' }}>
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontWeight: '700', fontSize: '1.1rem' }}
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Centro de Costo *</label>
              <select
                className="form-select"
                value={centroCosto}
                onChange={(e) => handleCentroCostoChange(e.target.value)}
                required
              >
                <option value="">-- Seleccionar Centro de Costo --</option>
                {centrosCostoDisponibles.map((cc) => (
                  <option key={cc} value={cc}>
                    {cc}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Categoría del Gasto *</label>
              <select
                className="form-select"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
              >
                <option value="">
                  {centroCosto ? '-- Seleccionar Categoría --' : '-- Primero seleccione un Centro de Costo --'}
                </option>
                {categoriasDelCentro.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Concepto o Justificación *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describa el motivo por el cual requiere el adelanto..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          {/* Apartado: Destinatario y Datos de Abono */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem 1.15rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CreditCard size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: '700', margin: 0 }}>
                  Destinatario del Abono / Desembolso
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, marginTop: '0.15rem' }}>
                  Indica si el adelanto se emitirá a tu nombre o a un tercero.
                </p>
              </div>
            </div>

            {/* Seleccionable: A mí vs A un tercero y barra de Caja / Yape / Plin */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: destinatarioTipo === 'A_MI' && (miModalidadAbono === 'YAPE' || miModalidadAbono === 'PLIN')
                ? 'repeat(auto-fit, minmax(210px, 1fr))' 
                : destinatarioTipo === 'A_MI'
                ? 'repeat(auto-fit, minmax(240px, 1fr))'
                : '1fr',
              gap: '0.85rem',
              alignItems: 'start'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '20px',
                  lineHeight: '20px',
                  marginBottom: '0.45rem'
                }}>
                  ¿A quién se debe abonar el dinero? *
                </label>
                <select
                  className="form-select"
                  value={destinatarioTipo}
                  onChange={(e) => setDestinatarioTipo(e.target.value)}
                  style={{ fontWeight: '600', fontSize: '0.92rem', height: '42px', boxSizing: 'border-box' }}
                >
                  <option value="A_MI">👤 A mí ({currentUser?.nombres} {currentUser?.apellidos})</option>
                  <option value="TERCERO">👥 A un tercero (Proveedor, chofer o externo)</option>
                </select>
              </div>

              {/* Si es "A mí": Barra seleccionable de 3 opciones (Caja, Yape o Plin) - NINGUNA PRESELECCIONADA */}
              {destinatarioTipo === 'A_MI' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minHeight: '20px',
                    lineHeight: '20px',
                    marginBottom: '0.45rem'
                  }}>
                    Modalidad de Abono *
                  </label>
                  <div style={{
                    display: 'flex',
                    background: '#e2e8f0',
                    padding: '3px',
                    borderRadius: '8px',
                    gap: '4px',
                    height: '42px',
                    boxSizing: 'border-box',
                    alignItems: 'center'
                  }}>
                    {/* Botón 1: Caja */}
                    <button
                      type="button"
                      onClick={() => setMiModalidadAbono('EFECTIVO_CAJA')}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        padding: '0 0.25rem',
                        transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                        background: miModalidadAbono === 'EFECTIVO_CAJA' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
                        color: miModalidadAbono === 'EFECTIVO_CAJA' ? '#ffffff' : '#64748b',
                        boxShadow: miModalidadAbono === 'EFECTIVO_CAJA' ? '0 2px 6px rgba(5, 150, 105, 0.35)' : 'none'
                      }}
                      title="Recibir en efectivo en ventanilla de caja"
                    >
                      <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>💵</span>
                      <span>Caja</span>
                    </button>

                    {/* Botón 2: Yape */}
                    <button
                      type="button"
                      onClick={() => setMiModalidadAbono('YAPE')}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        padding: '0 0.25rem',
                        transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                        background: miModalidadAbono === 'YAPE' ? 'linear-gradient(135deg, #742284 0%, #9026a3 100%)' : 'transparent',
                        color: miModalidadAbono === 'YAPE' ? '#ffffff' : '#64748b',
                        boxShadow: miModalidadAbono === 'YAPE' ? '0 2px 6px rgba(116, 34, 132, 0.35)' : 'none'
                      }}
                      title="Transferencia a billetera digital Yape"
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: miModalidadAbono === 'YAPE' ? '#ffffff' : '#742284',
                        color: miModalidadAbono === 'YAPE' ? '#742284' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        flexShrink: 0
                      }}>Y</span>
                      <span>Yape</span>
                    </button>

                    {/* Botón 3: Plin */}
                    <button
                      type="button"
                      onClick={() => setMiModalidadAbono('PLIN')}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        padding: '0 0.25rem',
                        transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                        background: miModalidadAbono === 'PLIN' ? 'linear-gradient(135deg, #00b5e2 0%, #0090b8 100%)' : 'transparent',
                        color: miModalidadAbono === 'PLIN' ? '#ffffff' : '#64748b',
                        boxShadow: miModalidadAbono === 'PLIN' ? '0 2px 6px rgba(0, 181, 226, 0.35)' : 'none'
                      }}
                      title="Transferencia a billetera digital Plin"
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: miModalidadAbono === 'PLIN' ? '#ffffff' : '#00b5e2',
                        color: miModalidadAbono === 'PLIN' ? '#00b5e2' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        flexShrink: 0
                      }}>⚡</span>
                      <span>Plin</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Si es "A mí" y eligió Yape o Plin: Input para el número celular */}
              {destinatarioTipo === 'A_MI' && (miModalidadAbono === 'YAPE' || miModalidadAbono === 'PLIN') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minHeight: '20px',
                    lineHeight: '20px',
                    marginBottom: '0.45rem'
                  }}>
                    Mi número de {miModalidadAbono === 'PLIN' ? 'Plin' : 'Yape'} a abonar *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Ej. 987 654 321"
                    value={miNumeroAbono}
                    onChange={(e) => setMiNumeroAbono(e.target.value)}
                    required
                    style={{ fontWeight: '600', height: '42px', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            {/* Mensajes según lo seleccionado en "A mí" */}
            {destinatarioTipo === 'A_MI' && !miModalidadAbono && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.85rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                <span style={{ fontSize: '1.1rem' }}>👈</span>
                <span>
                  <strong>Selecciona una modalidad:</strong> Elige <strong>Caja</strong> si recogerás efectivo en ventanilla, o <strong>Yape</strong> / <strong>Plin</strong> para transferencia a tu celular.
                </span>
              </div>
            )}

            {destinatarioTipo === 'A_MI' && miModalidadAbono === 'EFECTIVO_CAJA' && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.85rem',
                background: '#f0fdf4',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.8rem',
                color: '#166534'
              }}>
                <span style={{ fontSize: '1.1rem' }}>💵</span>
                <span>
                  <strong>Retiro en Efectivo (Ventanilla):</strong> Una vez aprobado el adelanto, acércate a la ventanilla de Caja Chica para recibir el dinero en efectivo. No requieres ingresar número de cuenta ni celular.
                </span>
              </div>
            )}

            {destinatarioTipo === 'A_MI' && (miModalidadAbono === 'YAPE' || miModalidadAbono === 'PLIN') && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.85rem',
                background: miModalidadAbono === 'PLIN' ? '#f0f9ff' : '#faf5ff',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${miModalidadAbono === 'PLIN' ? '#bae6fd' : '#e9d5ff'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.8rem',
                color: miModalidadAbono === 'PLIN' ? '#0369a1' : '#6b21a8',
                transition: 'all 0.2s ease'
              }}>
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <span>
                  <strong>Confirma tu número de {miModalidadAbono === 'PLIN' ? 'Plin' : 'Yape'} a abonar:</strong> El cajero recibirá la orden para transferirte por <strong>{miModalidadAbono === 'PLIN' ? 'Plin' : 'Yape'}</strong> al número ingresado y quedará guardado para tus próximas solicitudes.
                </span>
              </div>
            )}

            {/* Si selecciona "A un tercero": Se despliega lo desarrollado */}
            {destinatarioTipo === 'TERCERO' && (
              <div style={{
                paddingTop: '0.95rem',
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  color: '#92400e',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <span>⚠️</span>
                  <span><strong>Abono a Tercero:</strong> Por favor especifica el medio, número y titular a quien Caja / Tesorería deberá transferir.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
                  
                  {/* Medio / Banco de Abono */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Medio o Entidad de Abono del Tercero *
                    </label>
                    <select
                      className="form-select"
                      value={abonoBanco}
                      onChange={(e) => {
                        const newBanco = e.target.value;
                        setAbonoBanco(newBanco);
                        if (newBanco === 'EFECTIVO_CAJA') {
                          setAbonoCuentaNumero('');
                        }
                      }}
                      required
                    >
                      <option value="">-- Seleccionar Medio o Entidad de Abono --</option>
                      {METODOS_DESTINO.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.icon} {m.label} ({m.sublabel})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* A qué número abonar */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      {abonoBanco === 'YAPE' || abonoBanco === 'PLIN'
                        ? '¿A qué número celular abonar al tercero? *'
                        : abonoBanco === 'EFECTIVO_CAJA'
                        ? 'Modalidad de Entrega'
                        : '¿A qué número de cuenta o CCI abonar? *'}
                    </label>

                    {abonoBanco === 'EFECTIVO_CAJA' ? (
                      <input
                        type="text"
                        className="form-input"
                        value="💵 Entrega en efectivo en ventanilla / caja física"
                        disabled
                        style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                      />
                    ) : (
                      <input
                        type={metodoSeleccionado.isPhone ? 'tel' : 'text'}
                        className="form-input"
                        placeholder={metodoSeleccionado.placeholder}
                        value={abonoCuentaNumero}
                        onChange={(e) => setAbonoCuentaNumero(e.target.value)}
                        required={abonoBanco !== 'EFECTIVO_CAJA'}
                      />
                    )}
                  </div>

                </div>

                {/* A nombre de qué tercero debe salir */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    ¿A nombre de qué tercero debe salir? (Titular o Razón Social) *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Nombre completo del proveedor, chofer o Razón Social"
                    value={abonoTitular}
                    onChange={(e) => setAbonoTitular(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.71rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>
                    Escribe el nombre exacto de la persona o empresa titular de la cuenta donde se hará la transferencia.
                  </span>
                </div>

              </div>
            )}

          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.85rem',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-text)',
              fontSize: '0.8rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', maxWidth: '240px' }}
            >
              <Send size={15} />
              <span>{submitting ? 'Solicitando...' : 'Solicitar Adelanto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
