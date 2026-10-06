import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Caja Chica PWA Engine',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  });
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
