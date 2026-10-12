/**
 * Utilidades para visualización y descarga segura de comprobantes y archivos adjuntos.
 * Resuelve el bug de Chromium (Chrome / Edge) donde las URLs Base64 (data:image/...)
 * abiertas directamente en una pestaña nueva cargan en pantalla negra hasta recargar (F5).
 */

export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const match = parts[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Error convirtiendo dataUrl a Blob:', err);
    return null;
  }
}

/**
 * Abre un archivo en una nueva pestaña sin el error de pantalla negra de Chrome.
 * Para data URLs en base64, genera un Blob URL que Chromium decodifica inmediatamente.
 */
export function abrirArchivoEnNuevaPestana(url, titulo = 'Documento') {
  if (!url) return;

  if (url.startsWith('data:')) {
    const blob = dataUrlToBlob(url);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        // En caso de que el bloqueador de popups bloquee window.open
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener,noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      // Revocar después de 2 minutos para liberar memoria
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      return;
    }
  }

  // URL HTTP/HTTPS normal
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Descarga el archivo de forma directa y limpia
 */
export function descargarArchivo(url, filename = 'comprobante') {
  if (!url) return;

  // Asegurar extensión si no la tiene
  let finalName = filename;
  if (!finalName.includes('.')) {
    if (url.startsWith('data:application/pdf')) {
      finalName += '.pdf';
    } else if (url.startsWith('data:image/png')) {
      finalName += '.png';
    } else {
      finalName += '.jpg';
    }
  }

  if (url.startsWith('data:')) {
    const blob = dataUrlToBlob(url);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return;
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
