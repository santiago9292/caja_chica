import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { generarCajaChicaWorkbook } from './excelExporter';

function getExtensionFromDataUrl(dataUrl, defaultExt = 'jpg') {
  if (!dataUrl) return defaultExt;
  if (dataUrl.startsWith('data:image/png')) return 'png';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'jpg';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  if (dataUrl.startsWith('data:application/pdf')) return 'pdf';
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
            const ext = getExtensionFromDataUrl(r.archivo);
            const cleanNum = (r.numero || `comp_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            const cleanTipo = (r.tipo || 'COMP').replace(/[^a-zA-Z0-9_-]/g, '_');
            sustentos.push({
              nombre: `${sol.codigo}_${cleanTipo}_${cleanNum}.${ext}`,
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
      nombre: `${sol.codigo}_${cleanTipo}_${cleanNum}.${ext}`,
      dataUrl: sol.comprobante_archivo_url,
      tipo: sol.comprobante_tipo,
      numero: sol.comprobante_numero,
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

  // Múltiples sustentos -> crear ZIP
  const zip = new JSZip();
  sustentos.forEach(s => {
    if (s.dataUrl.startsWith('data:')) {
      const base64Data = s.dataUrl.split(',')[1];
      zip.file(s.nombre, base64Data, { base64: true });
    }
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `Sustentos_${sol.codigo}.zip`);
  return true;
}

/**
 * Exporta el reporte completo en un archivo .ZIP conteniendo:
 * 1. El Excel filtrado con los datos activos.
 * 2. Una carpeta 'sustentos/' con todas las imágenes de rendiciones adjuntas.
 */
export async function exportarReporteCompletoZip(solicitudes, cajaFondo, usuarioGenerador) {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // 1. Generar Excel y escribirlo en buffer
  const { wb, fileName: excelName } = generarCajaChicaWorkbook(solicitudes, cajaFondo, usuarioGenerador);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(excelName, excelBuffer);

  // 2. Carpeta de Sustentos dentro del ZIP
  const sustentosFolder = zip.folder('sustentos');
  let totalArchivosAdjuntos = 0;

  solicitudes.forEach(sol => {
    const sustentos = getSustentosDeSolicitud(sol);
    sustentos.forEach(s => {
      if (s.dataUrl && s.dataUrl.startsWith('data:')) {
        const base64Data = s.dataUrl.split(',')[1];
        sustentosFolder.file(s.nombre, base64Data, { base64: true });
        totalArchivosAdjuntos++;
      }
    });
  });

  // Generar el archivo ZIP final
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFileName = `Liquidacion_Caja_Chica_DICAR_LOGISTIC_${timestamp}.zip`;
  downloadBlob(zipBlob, zipFileName);

  return {
    success: true,
    fileName: zipFileName,
    excelName,
    totalSustentos: totalArchivosAdjuntos
  };
}
