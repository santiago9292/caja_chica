// Servicio de Consulta RUC mediante Factiliza API

const rucCache = new Map();

export async function consultarRuc(ruc) {
  const cleanRuc = (ruc || '').toString().trim().replace(/\D/g, '');
  
  if (cleanRuc.length !== 11) {
    return { success: false, error: 'El RUC debe contener exactamente 11 dígitos numéricos.' };
  }

  // Verificar caché local para ahorrar consultas
  if (rucCache.has(cleanRuc)) {
    return { success: true, data: rucCache.get(cleanRuc), fromCache: true };
  }

  const token = import.meta.env.VITE_FACTILIZA_TOKEN;
  if (!token) {
    return { 
      success: false, 
      error: 'No se ha configurado VITE_FACTILIZA_TOKEN en las variables de entorno.' 
    };
  }

  try {
    const response = await fetch(`https://api.factiliza.com/v1/ruc/info/${cleanRuc}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      return { success: false, error: 'Token de Factiliza inválido o vencido.' };
    }

    if (response.status === 404) {
      return { success: false, error: 'RUC no encontrado en SUNAT.' };
    }

    if (!response.ok) {
      return { success: false, error: `Error en consulta SUNAT (${response.status})` };
    }

    const json = await response.json();
    const info = json.data;

    if (!info) {
      return { success: false, error: 'Respuesta vacía de Factiliza.' };
    }

    const resultado = {
      numero: info.numero || cleanRuc,
      razonSocial: (info.nombre_o_razon_social || info.razon_social || '').trim(),
      estado: info.estado || '',
      condicion: info.condicion || '',
      direccion: info.direccion_completa || info.direccion || '',
      departamento: info.departamento || '',
      provincia: info.provincia || '',
      distrito: info.distrito || ''
    };

    rucCache.set(cleanRuc, resultado);

    return { success: true, data: resultado };
  } catch (err) {
    console.error('Error al consultar RUC con Factiliza:', err);
    return { 
      success: false, 
      error: 'No se pudo conectar con el servicio de consulta SUNAT. Verifique su conexión.' 
    };
  }
}
