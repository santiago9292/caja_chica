import React, { useState } from 'react';
import { 
  Upload, 
  X, 
  Receipt, 
  CheckCircle, 
  Plus, 
  Search, 
  Loader2, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Paperclip, 
  AlertCircle 
} from 'lucide-react';
import { consultarRuc } from '../lib/factilizaService';

export const TIPOS_COMPROBANTE = [
  { id: 'FACTURA', label: 'Factura Electrónica' },
  { id: 'BOLETA', label: 'Boleta de Venta' },
  { id: 'RECIBO_HONORARIOS', label: 'Recibo por Honorarios' },
  { id: 'TICKET_VALE', label: 'Ticket / Vale Autorizado' },
  { id: 'PLANILLA_MOVILIDAD', label: 'Planilla de Movilidad' },
  { id: 'SIN_COMPROBANTE', label: 'Sin Comprobante Físico' }
];

export function getTipoLabel(tipoId) {
  const match = TIPOS_COMPROBANTE.find(t => t.id === tipoId || t.label === tipoId);
  if (match) return match.label;
  if (tipoId === 'DECLARACION_JURADA') return 'Planilla de Movilidad';
  return tipoId || 'Comprobante';
}

function getFileCategory(dataUrl, fileName = '', fileType = '') {
  const name = (fileName || '').toLowerCase();
  const type = (fileType || '').toLowerCase();
  const url = (dataUrl || '').toLowerCase();

  if (url.startsWith('data:image/') || type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name)) {
    return 'image';
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || type.includes('spreadsheet') || type.includes('excel') || url.includes('spreadsheetml') || url.includes('ms-excel')) {
    return 'excel';
  }
  if (name.endsWith('.docx') || name.endsWith('.doc') || type.includes('word') || url.includes('wordprocessingml') || url.includes('msword')) {
    return 'word';
  }
  if (name.endsWith('.pdf') || type.includes('pdf') || url.startsWith('data:application/pdf')) {
    return 'pdf';
  }
  return 'file';
}

export function ModalRendicion({ solicitud, onClose, onRendir }) {
  const [comprobantes, setComprobantes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Estado del formulario actual
  const [tipo, setTipo] = useState('FACTURA');
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('');
  const [archivoTipo, setArchivoTipo] = useState('');

  // Estado de consulta RUC
  const [isSearchingRuc, setIsSearchingRuc] = useState(false);
  const [rucStatus, setRucStatus] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no debe superar los 15MB.');
      return;
    }

    setArchivoNombre(file.name);
    setArchivoTipo(file.type || '');

    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = (uploadEvent) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1280;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setArchivo(dataUrl);
        };
        img.onerror = () => {
          setArchivo(uploadEvent.target.result);
        };
        img.src = uploadEvent.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF, Excel (.xlsx, .xls), Word (.docx, .doc), etc.
      reader.onload = (uploadEvent) => {
        setArchivo(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const ejecutarBusquedaRuc = async (rucQuery) => {
    const clean = (rucQuery || '').toString().trim().replace(/\D/g, '');
    if (clean.length !== 11) {
      setRucStatus({ error: 'El RUC debe contener exactamente 11 dígitos' });
      return;
    }

    setIsSearchingRuc(true);
    setRucStatus(null);

    const res = await consultarRuc(clean);
    setIsSearchingRuc(false);

    if (res.success && res.data) {
      if (res.data.razonSocial) {
        setRazonSocial(res.data.razonSocial.toUpperCase());
      }
      setRucStatus({
        estado: res.data.estado,
        condicion: res.data.condicion,
        direccion: res.data.direccion
      });
    } else {
      setRucStatus({ error: res.error || 'No se encontró información' });
    }
  };

  const agregarComprobante = () => {
    if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
      alert("Ingrese un monto válido para el comprobante.");
      return;
    }
    
    if (!archivo) {
      alert("Es obligatorio adjuntar el sustento (Foto, PDF, Excel o Word) para poder agregar el comprobante.");
      return;
    }

    const cleanRuc = (ruc || '').toString().trim().replace(/\D/g, '');

    // Validación estricta de RUC (siempre 11 dígitos)
    if ((tipo === 'FACTURA' || tipo === 'RECIBO_HONORARIOS') && cleanRuc.length !== 11) {
      alert(`Para ${getTipoLabel(tipo)} es obligatorio ingresar un RUC de exactamente 11 dígitos numéricos.`);
      return;
    }

    if (cleanRuc.length > 0 && cleanRuc.length !== 11) {
      alert(`El RUC ingresado debe tener exactamente 11 dígitos numéricos (has ingresado ${cleanRuc.length}).`);
      return;
    }

    const nuevo = {
      tipo,
      numero: (numero || '').trim().toUpperCase(),
      fecha,
      ruc: cleanRuc,
      razonSocial: (razonSocial || '').trim().toUpperCase(),
      monto: parseFloat(monto),
      archivo,
      archivoNombre,
      archivoTipo
    };
    setComprobantes([...comprobantes, nuevo]);
    // Resetear form parcial
    setNumero('');
    setRuc('');
    setRazonSocial('');
    setMonto('');
    setArchivo('');
    setArchivoNombre('');
    setArchivoTipo('');
    setRucStatus(null);
  };

  const quitarComprobante = (idx) => {
    const arr = [...comprobantes];
    arr.splice(idx, 1);
    setComprobantes(arr);
  };

  const handleGuardar = async () => {
    if (comprobantes.length === 0) {
      alert("Debe agregar al menos un comprobante para rendir.");
      return;
    }
    setSubmitting(true);
    try {
      await onRendir(solicitud.id, comprobantes);
      onClose();
    } catch (err) {
      alert("Error al rendir: " + err.message);
      setSubmitting(false);
    }
  };

  const totalRendido = comprobantes.reduce((sum, c) => sum + c.monto, 0);
  const diferencia = totalRendido - Number(solicitud.monto);
  const fileCategory = getFileCategory(archivo, archivoNombre, archivoTipo);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Rendir Adelanto</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Código: <strong>{solicitud.codigo}</strong> | Adelanto: <strong>S/ {Number(solicitud.monto).toFixed(2)}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {/* Lista de Comprobantes Agregados */}
        {comprobantes.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#0f172a' }}>Comprobantes y Sustentos Adjuntos ({comprobantes.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {comprobantes.map((c, i) => {
                const cCat = getFileCategory(c.archivo, c.archivoNombre, c.archivoTipo);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong style={{ color: '#1e293b' }}>{getTipoLabel(c.tipo)} {c.numero ? `• ${c.numero}` : ''}</strong> <br />
                      <span style={{ color: 'var(--text-faint)' }}>
                        {c.razonSocial ? `${c.razonSocial} | ` : ''}{c.ruc ? `RUC: ${c.ruc} | ` : ''}{c.fecha}
                      </span>
                      {c.archivoNombre && (
                        <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Paperclip size={12} /> {c.archivoNombre}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <strong style={{ color: '#0f172a' }}>S/ {c.monto.toFixed(2)}</strong>
                      <button type="button" onClick={() => quitarComprobante(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }} title="Quitar">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <span>Total Rendido: <strong>S/ {totalRendido.toFixed(2)}</strong></span>
              <span style={{ color: diferencia < 0 ? '#ef4444' : (diferencia > 0 ? '#f59e0b' : '#10b981') }}>
                {diferencia < 0 ? `Falta rendir / devolver: S/ ${Math.abs(diferencia).toFixed(2)}` : (diferencia > 0 ? `Exceso (A favor): S/ ${diferencia.toFixed(2)}` : 'Rendición exacta')}
              </span>
            </div>
          </div>
        )}

        {/* Formulario para agregar un comprobante */}
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt size={16} /> Agregar Comprobante o Sustento
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de Comprobante / Sustento</label>
              <select className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS_COMPROBANTE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Serie y Número {tipo === 'PLANILLA_MOVILIDAD' ? '(Opcional)' : ''}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={tipo === 'PLANILLA_MOVILIDAD' ? 'EJ: MOV-01 (Opcional)' : 'EJ: F001-0012847'} 
                value={numero} 
                onChange={(e) => setNumero(e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fecha</label>
              <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  RUC Proveedor {(tipo === 'FACTURA' || tipo === 'RECIBO_HONORARIOS') ? <span style={{ color: '#ef4444' }}>* (11 dígitos)</span> : '(11 dígitos)'}
                </label>
                {isSearchingRuc && (
                  <span style={{ fontSize: '0.7rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Loader2 size={12} className="animate-spin" /> Buscando...
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  maxLength={11} 
                  className="form-input" 
                  placeholder={tipo === 'FACTURA' || tipo === 'RECIBO_HONORARIOS' ? '11 dígitos obligatorios' : (tipo === 'PLANILLA_MOVILIDAD' ? '11 dígitos (opcional)' : '11 dígitos')} 
                  value={ruc} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setRuc(val);
                    setRucStatus(null);
                    if (val.length === 11) {
                      ejecutarBusquedaRuc(val);
                    }
                  }} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      ejecutarBusquedaRuc(ruc);
                    }
                  }}
                  style={{ 
                    paddingRight: '2.5rem', 
                    letterSpacing: '0.5px', 
                    fontWeight: '600',
                    borderColor: ruc.length > 0 && ruc.length < 11 ? '#f59e0b' : undefined 
                  }}
                />
                <button
                  type="button"
                  onClick={() => ejecutarBusquedaRuc(ruc)}
                  disabled={isSearchingRuc || ruc.length !== 11}
                  title="Consultar en SUNAT vía Factiliza"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: ruc.length === 11 ? '#eff6ff' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: ruc.length === 11 ? '#2563eb' : '#94a3b8',
                    cursor: ruc.length === 11 ? 'pointer' : 'default',
                    padding: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSearchingRuc ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
              {ruc.length > 0 && ruc.length < 11 && (
                <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: '0.25rem', fontWeight: '500' }}>
                  ⚠️ El RUC debe tener exactamente 11 dígitos (llevas {ruc.length}/11)
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {tipo === 'PLANILLA_MOVILIDAD' ? 'Nombre / Motivo Desplazamiento' : 'Razón Social'}
                </label>
                {rucStatus && !rucStatus.error && (
                  <span style={{ 
                    fontSize: '0.68rem', 
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: rucStatus.estado === 'ACTIVO' && rucStatus.condicion === 'HABIDO' ? '#ecfdf5' : '#fef2f2',
                    color: rucStatus.estado === 'ACTIVO' && rucStatus.condicion === 'HABIDO' ? '#059669' : '#dc2626',
                    border: `1px solid ${rucStatus.estado === 'ACTIVO' && rucStatus.condicion === 'HABIDO' ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {rucStatus.estado || 'ACTIVO'} • {rucStatus.condicion || 'HABIDO'}
                  </span>
                )}
              </div>
              <input 
                type="text" 
                className="form-input" 
                placeholder={tipo === 'PLANILLA_MOVILIDAD' ? 'EJ: TRASLADO A PLANTA / CLIENTE' : 'NOMBRE O EMPRESA'} 
                value={razonSocial} 
                onChange={(e) => setRazonSocial(e.target.value.toUpperCase())} 
                style={{ textTransform: 'uppercase' }}
              />
              {rucStatus?.error && (
                <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.25rem' }}>
                  ⚠️ {rucStatus.error}
                </div>
              )}
              {rucStatus?.direccion && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rucStatus.direccion}>
                  📍 {rucStatus.direccion}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Monto (S/) *</label>
              <input type="number" step="0.01" min="0.10" className="form-input" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>
          </div>

          {/* Adjuntar Sustento Obligatorio */}
          <div style={{ marginTop: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: '700', color: '#0f172a' }}>
                Sustento Obligatorio (Foto / PDF / Excel / Word) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {tipo === 'PLANILLA_MOVILIDAD' && (
                <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  Acepta Excel (.xlsx, .xls), Word (.docx, .doc), PDF e Imágenes
                </span>
              )}
            </div>

            {!archivo ? (
              <label style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '1.25rem 1rem', 
                border: '2px dashed #94a3b8', 
                borderRadius: 'var(--radius-md)', 
                cursor: 'pointer', 
                background: '#ffffff',
                transition: 'all 0.2s ease'
              }}>
                <Upload size={24} color="#2563eb" style={{ marginBottom: '0.35rem' }} />
                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600' }}>
                  Subir archivo o tomar foto del sustento
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Formatos permitidos: Imágenes (JPG, PNG), PDF, Excel (.xlsx, .xls) y Word (.docx, .doc) — Máx. 15MB
                </span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
              </label>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff', padding: fileCategory === 'image' ? 0 : '1rem' }}>
                {fileCategory === 'image' ? (
                  <div style={{ background: '#0f172a', textAlign: 'center' }}>
                    <img src={archivo} alt="Comprobante" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: fileCategory === 'excel' ? '#ecfdf5' : fileCategory === 'word' ? '#eff6ff' : fileCategory === 'pdf' ? '#fef2f2' : '#f1f5f9',
                      color: fileCategory === 'excel' ? '#059669' : fileCategory === 'word' ? '#2563eb' : fileCategory === 'pdf' ? '#dc2626' : '#475569'
                    }}>
                      {fileCategory === 'excel' && <FileSpreadsheet size={24} />}
                      {fileCategory === 'word' && <FileText size={24} />}
                      {fileCategory === 'pdf' && <FileText size={24} />}
                      {fileCategory === 'file' && <File size={24} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {archivoNombre || 'Archivo adjunto cargado'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Documento {fileCategory} listo para guardar
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  type="button" 
                  onClick={() => {
                    setArchivo('');
                    setArchivoNombre('');
                    setArchivoTipo('');
                  }} 
                  style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    background: '#dc2626', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '26px', 
                    height: '26px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} 
                  title="Eliminar archivo"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={agregarComprobante} 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}
            >
              <Plus size={16} /> Agregar a la lista
            </button>
          </div>
        </div>

        {diferencia > 0 && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              💰
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '0.85rem' }}>
                Saldo a tu favor: S/ {diferencia.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                El total de tus comprobantes (S/ {totalRendido.toFixed(2)}) supera el adelanto entregado (S/ {Number(solicitud.monto).toFixed(2)}). Al finalizar, se enviará una solicitud al Administrador para autorizar el reembolso de tus <strong>S/ {diferencia.toFixed(2)}</strong> en Caja.
              </div>
            </div>
          </div>
        )}

        {diferencia < 0 && comprobantes.length > 0 && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            color: '#b45309'
          }}>
            ⚠️ <strong>Sobrante de efectivo: S/ {Math.abs(diferencia).toFixed(2)}</strong>. Debes entregar los S/ {Math.abs(diferencia).toFixed(2)} no utilizados al Cajero. Tu rendición quedará <strong>Por Devolver</strong> hasta que Caja confirme la recepción del efectivo.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={submitting}>
            Cancelar
          </button>
          <button 
            onClick={handleGuardar} 
            className="btn btn-primary" 
            disabled={submitting || comprobantes.length === 0}
            style={{ fontWeight: '700' }}
          >
            {submitting 
              ? 'Guardando...' 
              : diferencia > 0 
                ? `Finalizar y Solicitar Reembolso (S/ ${diferencia.toFixed(2)})` 
                : 'Finalizar Rendición'}
          </button>
        </div>
      </div>
    </div>
  );
}

