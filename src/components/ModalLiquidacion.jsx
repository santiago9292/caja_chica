import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Archive, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileCheck, 
  Layers, 
  Building2, 
  Calendar, 
  UserCheck, 
  CheckSquare, 
  Square,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportarReporteCompletoZip, getSustentosDeSolicitud } from '../lib/zipExporter';

export function ModalLiquidacion({ 
  isOpen, 
  onClose, 
  solicitudes = [], 
  cajaFondo, 
  currentUser, 
  onLiquidar 
}) {
  if (!isOpen) return null;

  // Filtrar exclusivamente los gastos que ya están RENDIDOS y listos para liquidar contablemente
  const gastosRendidos = solicitudes.filter(s => s.estado === 'RENDIDO');

  // Calcular el siguiente código correlativo de liquidación
  const calcularSiguienteCodigo = () => {
    const year = new Date().getFullYear();
    const prefix = `LIQ-${year}-`;
    const codigosExistentes = solicitudes
      .map(s => {
        if (s.liquidacion_codigo) return s.liquidacion_codigo;
        if (s.observaciones_aprobador) {
          const match = s.observaciones_aprobador.match(/\[Liquidado\s+(LIQ-[A-Z0-9_-]+)/i);
          if (match) return match[1];
        }
        return null;
      })
      .filter(c => c && c.startsWith(prefix));

    let maxNum = 0;
    codigosExistentes.forEach(c => {
      const parts = c.split('-');
      if (parts.length >= 3) {
        const n = parseInt(parts[2], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });

    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  };

  const [codigoLiquidacion, setCodigoLiquidacion] = useState(calcularSiguienteCodigo());
  const [selectedIds, setSelectedIds] = useState(gastosRendidos.map(g => g.id));
  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Actualizar seleccionados si cambian los rendidos al abrir
  useEffect(() => {
    setSelectedIds(gastosRendidos.map(g => g.id));
    setCodigoLiquidacion(calcularSiguienteCodigo());
    setErrorMsg('');
  }, [isOpen]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === gastosRendidos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(gastosRendidos.map(g => g.id));
    }
  };

  const getMontoReal = (s) => {
    if (s.rendiciones) {
      try {
        const list = typeof s.rendiciones === 'string' ? JSON.parse(s.rendiciones) : s.rendiciones;
        if (Array.isArray(list) && list.length > 0) {
          const sum = list.reduce((acc, c) => acc + Number(c.monto || 0), 0);
          if (sum > 0) return sum;
        }
      } catch (e) {}
    }
    return Number(s.monto || 0);
  };

  const seleccionadosList = gastosRendidos.filter(g => selectedIds.includes(g.id));
  const totalMontoSeleccionado = seleccionadosList.reduce((acc, cur) => acc + getMontoReal(cur), 0);
  
  // Total de comprobantes físicos en los seleccionados
  const totalComprobantes = seleccionadosList.reduce((acc, cur) => {
    const sustentos = getSustentosDeSolicitud(cur);
    return acc + (sustentos.length > 0 ? sustentos.length : 1);
  }, 0);

  const handleProcesarLiquidacion = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Debes seleccionar al menos un gasto rendido para liquidar.');
      return;
    }

    if (!codigoLiquidacion.trim()) {
      setErrorMsg('El código de liquidación es obligatorio.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Exportar el archivo ZIP oficial con el número de liquidación
      const cleanCodigo = codigoLiquidacion.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
      const customPrefix = `Liquidacion_${cleanCodigo}_CORPORACION_CADILLO_Y_ROJO_SAC`;
      
      await exportarReporteCompletoZip(seleccionadosList, cajaFondo, currentUser, customPrefix);

      // 2. Transicionar de RENDIDO a LIQUIDADO en base de datos / store
      if (onLiquidar) {
        await onLiquidar({
          solicitudIds: selectedIds,
          codigoLiquidacion: cleanCodigo,
          observaciones: observaciones.trim()
        });
      }

      // 3. Celebración y cierre
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onClose();
    } catch (err) {
      setErrorMsg('Error procesando liquidación: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Cabecera del Modal */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#047857',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Liquidación Oficial de Gastos Rendidos
                </h3>
                <span className="badge badge-aprobado" style={{ fontSize: '0.7rem' }}>
                  Corte Contable
                </span>
              </div>
              <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                Solo se incluyen gastos en estado <strong>RENDIDO</strong>. Al procesar, se generará el ZIP con Excel + comprobantes y los gastos pasarán a <strong>LIQUIDADO</strong>.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.35rem', borderRadius: '50%', color: '#64748b' }}
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: '1' }}>
          
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Configuración del Corte de Liquidación */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', color: '#334155' }}>
                Código de Liquidación *
              </label>
              <input
                type="text"
                className="form-input"
                style={{ fontWeight: '700', fontFamily: 'monospace', textTransform: 'uppercase' }}
                value={codigoLiquidacion}
                onChange={(e) => setCodigoLiquidacion(e.target.value.toUpperCase())}
                placeholder="LIQ-2026-001"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', color: '#334155' }}>
                Fecha de Corte
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                <Calendar size={16} color="#64748b" />
                <span>{new Date().toLocaleDateString('es-PE', { dateStyle: 'long' })}</span>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', color: '#334155' }}>
                Responsable del Cierre
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1e293b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <UserCheck size={16} color="#059669" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.nombres} {currentUser?.apellidos}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjetas KPI de Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', color: '#0f172a' }}>
                <CheckSquare size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {selectedIds.length} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>/ {gastosRendidos.length}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Gastos Seleccionados</div>
              </div>
            </div>

            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', color: '#047857' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#047857', lineHeight: 1.1 }}>
                  S/ {totalMontoSeleccionado.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '600' }}>Total a Liquidar</div>
              </div>
            </div>

            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', color: '#1d4ed8' }}>
                <Archive size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1d4ed8', lineHeight: 1.1 }}>
                  {totalComprobantes}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: '600' }}>Comprobantes Físicos</div>
              </div>
            </div>
          </div>

          {/* Tabla de Rendidos Pendientes de Liquidar */}
          {gastosRendidos.length === 0 ? (
            <div style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              background: '#f8fafc',
              border: '2px dashed #e2e8f0',
              borderRadius: '10px'
            }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ color: '#0f172a', fontWeight: '700', marginBottom: '0.25rem' }}>
                ¡Todo al día! No hay gastos rendidos pendientes de liquidar
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto' }}>
                Todos los gastos rendidos anteriores ya han sido liquidados. Cuando los colaboradores completen nuevas rendiciones de adelantos, aparecerán en esta lista automáticamente para el próximo corte.
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{
                maxHeight: '320px',
                overflowY: 'auto'
              }}>
                <table className="data-table" style={{ fontSize: '0.8rem', minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '38px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === gastosRendidos.length && gastosRendidos.length > 0}
                          onChange={toggleSelectAll}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0f172a' }}
                          title="Marcar / Desmarcar todos"
                        />
                      </th>
                      <th>Código</th>
                      <th>Fecha</th>
                      <th>Solicitante</th>
                      <th>CECO & Categoría</th>
                      <th>Comprobante</th>
                      <th>Concepto</th>
                      <th style={{ textAlign: 'right' }}>Monto S/</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastosRendidos.map((sol) => {
                      const isSelected = selectedIds.includes(sol.id);
                      const montoSol = getMontoReal(sol);
                      const sustentos = getSustentosDeSolicitud(sol);

                      return (
                        <tr 
                          key={sol.id}
                          onClick={() => toggleSelect(sol.id)}
                          style={{ 
                            cursor: 'pointer',
                            background: isSelected ? '#f8fafc' : '#ffffff',
                            transition: 'background 0.1s'
                          }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(sol.id)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0f172a' }}
                            />
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                            {sol.codigo}
                          </td>
                          <td>{new Date(sol.created_at).toLocaleDateString('es-PE')}</td>
                          <td>{sol.solicitante_nombre}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>
                              {sol.categoria ? sol.categoria.replace(/_/g, ' ') : '-'}
                            </div>
                            {sol.centro_costo && (
                              <div style={{ fontSize: '0.7rem', color: '#0369a1', fontFamily: 'monospace', fontWeight: '700' }}>
                                {sol.centro_costo}
                              </div>
                            )}
                          </td>
                          <td>
                            {(() => {
                              if (sol.rendiciones) {
                                try {
                                  const r = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
                                  if (Array.isArray(r) && r.length > 0) {
                                    return r.length === 1 
                                      ? `${r[0].tipo} ${r[0].numero}` 
                                      : `${r.length} Comprobantes`;
                                  }
                                } catch (e) {}
                              }
                              return sol.comprobante_numero || 'Comprobante adjunto';
                            })()}
                          </td>
                          <td>
                            <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sol.motivo}>
                              {sol.motivo}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            S/ {montoSol.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {selectedIds.length > 0 ? (
              <span>Se marcarán como <strong>LIQUIDADO</strong> y se descargará el ZIP de sustentos.</span>
            ) : (
              <span>Selecciona los gastos para habilitar el botón de liquidación.</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isProcessing}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleProcesarLiquidacion}
              disabled={isProcessing || selectedIds.length === 0}
              className="btn btn-excel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.875rem'
              }}
            >
              {isProcessing ? (
                <>
                  <Download size={16} className="animate-spin" />
                  <span>Procesando y Empaquetando...</span>
                </>
              ) : (
                <>
                  <Archive size={16} />
                  <span>Procesar Liquidación ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
