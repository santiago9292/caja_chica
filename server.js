import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración Supabase y OneSignal
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const ONESIGNAL_APP_ID = process.env.VITE_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID || 'c50fba12-7b4e-45e9-8bc5-63d9639a2b53';
const ONESIGNAL_REST_KEY = process.env.VITE_ONESIGNAL_REST_KEY || process.env.ONESIGNAL_REST_KEY;

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Verifica si está dentro de horario laboral (8:00 AM a 6:00 PM hora peruana, UTC-5)
function isHorarioLaboral() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      hour: 'numeric',
      hourCycle: 'h23' // Garantiza formato 0 a 23 siempre sin ambigüedades de AM/PM
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    // Solo de 8:00 AM (8) a 5:59 PM (17) en hora de Lima
    return hour >= 8 && hour < 18;
  } catch (e) {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const peruHour = (utcHour - 5 + 24) % 24;
    return peruHour >= 8 && peruHour < 18;
  }
}

// Envío de notificación Push directa vía OneSignal
async function sendOneSignalPush(title, message, targetDnis = null, webUrl = '') {
  if (!ONESIGNAL_REST_KEY) {
    console.warn('⚠️ No se ha configurado VITE_ONESIGNAL_REST_KEY en el servidor.');
    return null;
  }
  try {
    const body = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, es: title },
      contents: { en: message, es: message },
      target_channel: 'push',
      priority: 10,
      ttl: 86400
    };
    if (webUrl) {
      body.web_url = webUrl;
    }
    if (targetDnis && targetDnis.length > 0) {
      body.include_aliases = { external_id: targetDnis.map(String) };
    } else {
      body.included_segments = ["Total Subscriptions"];
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify(body)
    });
    const result = await res.json().catch(() => ({}));
    return result;
  } catch (err) {
    console.error('Error enviando push OneSignal desde backend:', err.message);
    return null;
  }
}

// Historial y estado de los recordatorios
let ultimoChequeoRecordatorios = null;
let historialRecordatoriosEnviados = [];

// Función para verificar y disparar recordatorios cada 4 horas
async function verificarRecordatoriosRendicion(force = false) {
  ultimoChequeoRecordatorios = new Date().toISOString();

  if (!force && !isHorarioLaboral()) {
    console.log(`[Recordatorios] Fuera de horario laboral (8:00 - 18:00 Lima). Omitiendo verificación.`);
    return { ejecutado: false, motivo: 'Fuera de horario laboral' };
  }

  if (!supabase) {
    console.warn(`[Recordatorios] Supabase no configurado en backend.`);
    return { ejecutado: false, motivo: 'Supabase no configurado' };
  }

  try {
    // 1. Obtener solicitudes que están actualmente en estado POR_RENDIR
    const { data: solicitudes, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('estado', 'POR_RENDIR');

    if (error) {
      console.error('[Recordatorios] Error consultando solicitudes en Supabase:', error);
      return { ejecutado: false, error: error.message };
    }

    if (!solicitudes || solicitudes.length === 0) {
      return { ejecutado: true, enviados: 0, mensaje: 'No hay solicitudes por rendir' };
    }

    const ahora = Date.now();
    const CUATRO_HORAS_MS = 4 * 60 * 60 * 1000;
    const enviados = [];

    for (const sol of solicitudes) {
      // Fecha en que se entregó el dinero o se creó
      const fechaBaseStr = sol.pagado_fecha || sol.abono_fecha || sol.created_at;
      const fechaBase = new Date(fechaBaseStr).getTime();
      const tiempoDesdeEntrega = ahora - fechaBase;

      // Si aún no transcurren 4 horas desde la entrega del dinero, omitir
      if (tiempoDesdeEntrega < CUATRO_HORAS_MS) {
        continue;
      }

      // 2. Verificar cuándo se envió el último recordatorio de esta solicitud
      const { data: ultimasNotifs } = await supabase
        .from('notificaciones')
        .select('created_at')
        .eq('referencia_id', sol.id)
        .ilike('titulo', '%Recordatorio%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (ultimasNotifs && ultimasNotifs.length > 0) {
        const ultimoEnvio = new Date(ultimasNotifs[0].created_at).getTime();
        const tiempoDesdeUltimo = ahora - ultimoEnvio;
        if (tiempoDesdeUltimo < CUATRO_HORAS_MS) {
          // Ya se le envió recordatorio hace menos de 4 horas
          continue;
        }
      }

      // 3. Preparar mensaje y notificar
      const primerNombre = (sol.solicitante_nombre || '').split(' ')[0] || 'Estimado(a)';
      const montoFormateado = Number(sol.monto || 0).toFixed(2);
      const horasTranscurridas = Math.floor(tiempoDesdeEntrega / (1000 * 60 * 60));

      const titulo = `⏰ Recordatorio: Liquidación por Rendir (${sol.codigo})`;
      const mensaje = `Hola ${primerNombre}, tienes una liquidación pendiente por rendir de S/ ${montoFormateado} (${sol.codigo}) entregada hace ${horasTranscurridas}h. Por favor sube tus comprobantes para sustentar el gasto.`;

      // Insertar en tabla notificaciones de Supabase
      try {
        await supabase.from('notificaciones').insert({
          usuario_dni: String(sol.solicitante_dni),
          titulo,
          mensaje,
          tipo: 'WARNING',
          referencia_id: sol.id,
          leido: false
        });
      } catch (e) {
        console.warn('[Recordatorios] Error guardando notificacion en DB:', e.message);
      }

      // Enviar Push a OneSignal
      const pushRes = await sendOneSignalPush(
        titulo,
        mensaje,
        [sol.solicitante_dni],
        `/?notif=POR_RENDIR&sol=${sol.solicitante_dni}`
      );

      const detalleEnvio = {
        solicitudId: sol.id,
        codigo: sol.codigo,
        solicitante_dni: sol.solicitante_dni,
        solicitante_nombre: sol.solicitante_nombre,
        monto: sol.monto,
        horasTranscurridas,
        timestamp: new Date().toISOString(),
        pushStatus: pushRes ? 'enviado' : 'push_omitido_o_error'
      };

      enviados.push(detalleEnvio);
      historialRecordatoriosEnviados.unshift(detalleEnvio);
      if (historialRecordatoriosEnviados.length > 30) historialRecordatoriosEnviados.pop();

      console.log(`[Recordatorios] ✅ Recordatorio enviado a ${sol.solicitante_nombre} (${sol.codigo})`);
    }

    return {
      ejecutado: true,
      solicitudesPorRendirTotal: solicitudes.length,
      enviadosCount: enviados.length,
      enviados
    };
  } catch (err) {
    console.error('[Recordatorios] Error ejecutando verificación:', err);
    return { ejecutado: false, error: err.message };
  }
}

// Programar verificación periódica cada 15 minutos en background
const INTERVALO_RECORDATORIOS_MS = 15 * 60 * 1000;
setInterval(() => {
  verificarRecordatoriosRendicion().catch(e => console.error('Error en tarea periódica:', e));
}, INTERVALO_RECORDATORIOS_MS);

// Primera comprobación a los 10 segundos tras levantar el servidor
setTimeout(() => {
  verificarRecordatoriosRendicion().catch(() => {});
}, 10000);

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Caja Chica PWA Engine',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    horarioLaboral: isHorarioLaboral()
  });
});

// Endpoint para consultar estado o forzar chequeo de recordatorios
app.get('/api/recordatorios-status', async (req, res) => {
  try {
    let porRendir = [];
    if (supabase) {
      const { data } = await supabase
        .from('solicitudes')
        .select('id, codigo, solicitante_dni, solicitante_nombre, monto, pagado_fecha, created_at, estado')
        .eq('estado', 'POR_RENDIR');
      porRendir = data || [];
    }
    res.json({
      horarioLaboral: isHorarioLaboral(),
      horaActualLima: new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima' }),
      ultimoChequeo: ultimoChequeoRecordatorios,
      solicitudesPorRendirCount: porRendir.length,
      solicitudesPorRendir: porRendir,
      historialRecientes: historialRecordatoriosEnviados
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/check-recordatorios', async (req, res) => {
  try {
    const force = Boolean(req.query.force === 'true' || req.body?.force);
    const resultado = await verificarRecordatoriosRendicion(force);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para generación avanzada de reporte Excel de Caja Chica
app.post('/api/export-excel', (req, res) => {
  try {
    const { items, title = 'Reporte de Caja Chica', empresa = 'MI EMPRESA S.A.C.', fecha = new Date().toLocaleDateString('es-PE') } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'La lista de items es requerida' });
    }

    // Preparar Hoja 1: Movimientos detallados
    const dataMovimientos = items.map((item, idx) => ({
      'Item': idx + 1,
      'Código': item.codigo,
      'Fecha': item.created_at ? new Date(item.created_at).toLocaleDateString('es-PE') : '-',
      'Tipo': item.tipo === 'ADELANTO_DINERO' ? 'Adelanto de Efectivo' : 'Rendición de Gasto',
      'DNI Solicitante': item.solicitante_dni,
      'Nombre Solicitante': item.solicitante_nombre,
      'Categoría': item.categoria,
      'Tipo Comprobante': item.comprobante_tipo || 'N/A',
      'N° Comprobante': item.comprobante_numero || '-',
      'RUC Emisor': item.comprobante_ruc_emisor || '-',
      'Razón Social Proveedor': item.comprobante_razon_social || '-',
      'Concepto / Motivo': item.motivo,
      'Importe S/': Number(item.monto || 0),
      'Estado': item.estado,
      'Aprobado Por': item.aprobado_por_nombre || '-',
      'Fecha Aprobación': item.aprobado_fecha ? new Date(item.aprobado_fecha).toLocaleDateString('es-PE') : '-'
    }));

    // Preparar Hoja 2: Resumen por Categoría
    const catMap = {};
    items.forEach(it => {
      const cat = it.categoria || 'OTROS';
      const m = Number(it.monto || 0);
      if (!catMap[cat]) catMap[cat] = { 'Categoría': cat, 'Total S/': 0, 'Cantidad Operaciones': 0 };
      catMap[cat]['Total S/'] += m;
      catMap[cat]['Cantidad Operaciones'] += 1;
    });
    const dataCategorias = Object.values(catMap);

    // Preparar Hoja 3: Resumen por Solicitante
    const solMap = {};
    items.forEach(it => {
      const dni = it.solicitante_dni || 'SIN DNI';
      const nom = it.solicitante_nombre || 'Desconocido';
      const m = Number(it.monto || 0);
      if (!solMap[dni]) solMap[dni] = { 'DNI': dni, 'Solicitante': nom, 'Total Solicitado S/': 0, 'Total Registros': 0 };
      solMap[dni]['Total Solicitado S/'] += m;
      solMap[dni]['Total Registros'] += 1;
    });
    const dataSolicitantes = Object.values(solMap);

    const wb = XLSX.utils.book_new();

    const wsMov = XLSX.utils.json_to_sheet(dataMovimientos);
    const wsCat = XLSX.utils.json_to_sheet(dataCategorias);
    const wsSol = XLSX.utils.json_to_sheet(dataSolicitantes);

    // Ancho de columnas automático
    wsMov['!cols'] = [
      { wch: 6 },  { wch: 16 }, { wch: 12 }, { wch: 20 },
      { wch: 15 }, { wch: 28 }, { wch: 20 }, { wch: 18 },
      { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 35 },
      { wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, wsMov, 'Libro Caja Chica');
    XLSX.utils.book_append_sheet(wb, wsCat, 'Resumen Categorías');
    XLSX.utils.book_append_sheet(wb, wsSol, 'Resumen Solicitantes');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="Caja_Chica_${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error generando Excel:', err);
    res.status(500).json({ error: 'Error al generar Excel: ' + err.message });
  }
});

// En producción servir archivos estáticos compilados
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
      if (err) res.status(200).send('Caja Chica API Backend - Servidor Activo');
    });
  } else {
    res.status(404).json({ error: 'Endpoint no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend Caja Chica corriendo en http://localhost:${PORT}`);
});
