import React, { useState } from 'react';
import { 
  Send, 
  Banknote, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { playNotificationSound } from '../lib/audioNotifier';

import { DEFAULT_CATEGORIAS } from '../lib/store';

export function FormularioIngreso({ currentUser, onSubmitSolicitud, onSuccessTab, categorias = [] }) {
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
  
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');

  const handleCentroCostoChange = (newCC) => {
    setCentroCosto(newCC);
    setCategoriaId(''); // Forzar a que elija la categoría
  };

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

    setSubmitting(true);
    try {
      const catObj = listaCategorias.find(c => c.id === categoriaId);
      const data = {
        tipo: 'ADELANTO_DINERO',
        solicitante_dni: currentUser.dni,
        solicitante_nombre: `${currentUser.nombres} ${currentUser.apellidos}`,
        monto: montoNum,
        motivo: motivo.trim(),
        categoria: catObj?.nombre || 'ADMINISTRACIÓN',
        centro_costo: centroCosto || catObj?.centro_costo || 'TRANS',
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
