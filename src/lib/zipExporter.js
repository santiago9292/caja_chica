import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { generarCajaChicaWorkbook } from './excelExporter';

function getExtensionFromDataUrl(dataUrl, defaultExt = 'jpg', fileName = '') {
  if (fileName && fileName.includes('.')) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  if (!dataUrl) return defaultExt;
  if (dataUrl.startsWith('data:image/png')) return 'png';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'jpg';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  if (dataUrl.startsWith('data:application/pdf')) return 'pdf';
  if (dataUrl.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return 'xlsx';
  if (dataUrl.startsWith('data:application/vnd.ms-excel')) return 'xls';
  if (dataUrl.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
  if (dataUrl.startsWith('data:application/msword')) return 'doc';
  return defaultExt;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function addFileToZipWithUniqueName(zipFolderOrRoot, rawName, dataUrl, usedNamesMap) {
  if (!dataUrl || typeof dataUrl !== 'string') return false;

  let finalName = rawName || 'sustento.jpg';

  if (usedNamesMap.has(finalName)) {
    const count = usedNamesMap.get(finalName) + 1;
    usedNamesMap.set(finalName, count);
    const dotIndex = finalName.lastIndexOf('.');
    if (dotIndex !== -1) {
      finalName = `${finalName.slice(0, dotIndex)}_(${count})${finalName.slice(dotIndex)}`;
    } else {
      finalName = `${finalName}_(${count})`;
    }
  } else {
    usedNamesMap.set(finalName, 1);
  }

  if (dataUrl.startsWith('data:')) {
    const parts = dataUrl.split(',');
    const base64Data = parts[1];
    if (!base64Data) return false;
    zipFolderOrRoot.file(finalName, base64Data, { base64: true });
    return true;
  } else if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('blob:')) {
    try {
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      zipFolderOrRoot.file(finalName, blob);
      return true;
    } catch (e) {
      console.error("Error fetching sustento:", e);
      return false;
    }
  }
  return false;
}

/**
 * Obtiene la lista de todos los sustentos con imagen/archivo de una solicitud
 */
export function getSustentosDeSolicitud(sol) {
  const sustentos = [];

  if (sol.rendiciones) {
    try {
      const rends = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
      if (Array.isArray(rends)) {
        rends.forEach((r, idx) => {
          if (r.archivo) {
            const ext = getExtensionFromDataUrl(r.archivo, 'jpg', r.archivoNombre || '');
            const cleanNum = (r.numero || `comp_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            const cleanTipo = (r.tipo || 'COMP').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileBaseName = r.archivoNombre 
              ? r.archivoNombre.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
              : `${cleanTipo}_${cleanNum}`;
            
            sustentos.push({
              nombre: `${sol.codigo}_Rendicion_${idx + 1}_${fileBaseName}.${ext}`,
              dataUrl: r.archivo,
              tipo: r.tipo,
              numero: r.numero,
              monto: r.monto
            });
          }
        });
      }
    } catch (e) {
      console.warn("Error leyendo rendiciones para sustentos:", e);
    }
  }

  if (sol.comprobante_archivo_url) {
    const ext = getExtensionFromDataUrl(sol.comprobante_archivo_url);
    const cleanNum = (sol.comprobante_numero || 'comprobante').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanTipo = (sol.comprobante_tipo || 'COMP').replace(/[^a-zA-Z0-9_-]/g, '_');
    sustentos.push({
      nombre: `${sol.codigo}_ComprobanteInicial_${cleanTipo}_${cleanNum}.${ext}`,
      dataUrl: sol.comprobante_archivo_url,
      tipo: sol.comprobante_tipo,
      numero: sol.comprobante_numero,
      monto: sol.monto
    });
  }

  if (sol.abono_sustento_url) {
    const ext = getExtensionFromDataUrl(sol.abono_sustento_url, 'jpg', sol.abono_sustento_nombre || '');
    const cleanOp = (sol.abono_operacion || 'ENTREGA').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileBaseName = sol.abono_sustento_nombre 
      ? sol.abono_sustento_nombre.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      : `ENTREGA_${cleanOp}`;

    sustentos.push({
      nombre: `${sol.codigo}_SustentoAbono_${fileBaseName}.${ext}`,
      dataUrl: sol.abono_sustento_url,
      tipo: 'SUSTENTO_ABONO',
      numero: sol.abono_operacion || '-',
      monto: sol.monto
    });
  }

  return sustentos;
}

/**
 * Descarga el sustento o sustentos de una sola fila
 */
export async function descargarSustentosSolicitud(sol) {
  const sustentos = getSustentosDeSolicitud(sol);

  if (sustentos.length === 0) {
    alert(`La solicitud ${sol.codigo} no tiene comprobantes ni imágenes adjuntas.`);
    return false;
  }

  if (sustentos.length === 1) {
    downloadDataUrl(sustentos[0].dataUrl, sustentos[0].nombre);
    return true;
  }

  // Múltiples sustentos -> crear ZIP con nombres únicos garantizados
  const zip = new JSZip();
  const usedNamesMap = new Map();

  for (const s of sustentos) {
    await addFileToZipWithUniqueName(zip, s.nombre, s.dataUrl, usedNamesMap);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `Sustentos_${sol.codigo}.zip`);
  return true;
}

/**
 * Exporta el reporte completo en un archivo .ZIP conteniendo:
 * 1. El Excel filtrado con los datos activos.
 * 2. Una carpeta 'sustentos/' con todas las imágenes de rendiciones adjuntas.
 */
export async function exportarReporteCompletoZip(solicitudes, cajaFondo, usuarioGenerador, customName = null) {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // 1. Generar Excel y escribirlo en buffer
  const excelCustomName = customName ? `${customName}` : null;
  const { wb, fileName: excelName } = generarCajaChicaWorkbook(solicitudes, cajaFondo, usuarioGenerador, excelCustomName);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(excelName, excelBuffer);

  // 2. Carpeta de Sustentos dentro del ZIP
  const sustentosFolder = zip.folder('sustentos');
  const usedNamesMap = new Map();
  let totalArchivosAdjuntos = 0;

  for (const sol of solicitudes) {
    const sustentos = getSustentosDeSolicitud(sol);
    for (const s of sustentos) {
      const added = await addFileToZipWithUniqueName(sustentosFolder, s.nombre, s.dataUrl, usedNamesMap);
      if (added) totalArchivosAdjuntos++;
    }
  }

  // Generar el archivo ZIP final
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFileName = customName ? `${customName}.zip` : `Liquidacion_Caja_Chica_DICAR_LOGISTIC_${timestamp}.zip`;
  downloadBlob(zipBlob, zipFileName);

  return {
    success: true,
    fileName: zipFileName,
    excelName,
    totalSustentos: totalArchivosAdjuntos
  };
}

