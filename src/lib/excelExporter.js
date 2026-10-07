import * as XLSX from 'xlsx';

export function generarCajaChicaWorkbook(solicitudes, cajaFondo, usuarioGenerador) {
  const wb = XLSX.utils.book_new();

  // 1. Hoja Principal de Movimientos
  const movimientosData = solicitudes.map((item, index) => {
    let compTipo = item.comprobante_tipo ? item.comprobante_tipo.replace(/_/g, ' ') : 'N/A';
    let compNum = item.comprobante_numero || '-';
    let compRuc = item.comprobante_ruc_emisor || '-';
    let compRazon = item.comprobante_razon_social || '-';

    if (item.rendiciones) {
      try {
        const r = typeof item.rendiciones === 'string' ? JSON.parse(item.rendiciones) : item.rendiciones;
        if (Array.isArray(r) && r.length > 0) {
          compTipo = r.map(x => x.tipo).join(' | ');
          compNum = r.map(x => x.numero).join(' | ');
          compRuc = r.map(x => x.ruc).join(' | ');
          compRazon = r.map(x => x.razonSocial).join(' | ');
        }
      } catch {}
    }

    return {
      'N°': index + 1,
      'Código': item.codigo,
      'Fecha Registro': new Date(item.created_at).toLocaleDateString('es-PE'),
      'Tipo de Solicitud': item.tipo === 'ADELANTO_DINERO' ? 'Adelanto de Dinero' : 'Rendición de Gasto',
      'DNI Solicitante': item.solicitante_dni,
      'Nombre del Solicitante': item.solicitante_nombre,
      'Categoría': item.categoria.replace(/_/g, ' '),
      'Centro de Costos': item.centro_costo || '-',
      'Tipo Comprobante': compTipo,
      'N° Comprobante': compNum,
      'RUC Proveedor': compRuc,
      'Razón Social Proveedor': compRazon,
      'Concepto / Justificación': item.motivo,
      'Monto (S/)': Number(item.monto || 0),
      'Estado': item.estado,
      'Aprobado Por': item.aprobado_por_nombre || '-',
      'Fecha Aprobación': item.aprobado_fecha ? new Date(item.aprobado_fecha).toLocaleDateString('es-PE') : '-',
      'Observaciones': item.observaciones_aprobador || '-'
    };
  });

  const wsMov = XLSX.utils.json_to_sheet(movimientosData);

    // Configurar anchos de columna óptimos
    wsMov['!cols'] = [
      { wch: 5 },  // N°
      { wch: 15 }, // Código
      { wch: 14 }, // Fecha
      { wch: 20 }, // Tipo
      { wch: 16 }, // DNI
      { wch: 30 }, // Nombre
      { wch: 22 }, // Categoría
      { wch: 20 }, // Centro de Costos
      { wch: 18 }, // Tipo Comprobante
      { wch: 16 }, // N° Comprobante
      { wch: 15 }, // RUC
      { wch: 32 }, // Razón Social
      { wch: 38 }, // Concepto
      { wch: 14 }, // Monto S/
      { wch: 14 }, // Estado
      { wch: 26 }, // Aprobador
      { wch: 16 }, // Fecha Aprob
      { wch: 30 }  // Observaciones
    ];

    // 2. Hoja de Resumen por Categoría
    const catTotales = {};
    solicitudes.forEach(s => {
      const cat = s.categoria.replace(/_/g, ' ') || 'OTROS';
      const m = Number(s.monto || 0);
      if (!catTotales[cat]) {
        catTotales[cat] = { 'Categoría de Gasto': cat, 'Total S/': 0, 'Total Comprobantes': 0, 'Aprobados S/': 0 };
      }
      catTotales[cat]['Total S/'] += m;
      catTotales[cat]['Total Comprobantes'] += 1;
      if (s.estado === 'APROBADO') {
        catTotales[cat]['Aprobados S/'] += m;
      }
    });

    const wsCat = XLSX.utils.json_to_sheet(Object.values(catTotales));
    wsCat['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];

    // 3. Hoja de Resumen por Solicitante
    const solTotales = {};
    solicitudes.forEach(s => {
      const dni = s.solicitante_dni;
      const nom = s.solicitante_nombre;
      const m = Number(s.monto || 0);
      if (!solTotales[dni]) {
        solTotales[dni] = {
          'DNI': dni,
          'Solicitante': nom,
          'Total Solicitado S/': 0,
          'Total Aprobado S/': 0,
          'Registros': 0
        };
      }
      solTotales[dni]['Total Solicitado S/'] += m;
      if (s.estado === 'APROBADO') {
        solTotales[dni]['Total Aprobado S/'] += m;
      }
      solTotales[dni]['Registros'] += 1;
    });

    const wsSol = XLSX.utils.json_to_sheet(Object.values(solTotales));
    wsSol['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];

    // 4. Hoja de Arqueo y Control General
    const totalSolicitado = solicitudes.reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
    const totalAprobado = solicitudes.filter(s => s.estado === 'APROBADO').reduce((acc, cur) => acc + Number(cur.monto || 0), 0);
    const totalPendiente = solicitudes.filter(s => s.estado === 'PENDIENTE').reduce((acc, cur) => acc + Number(cur.monto || 0), 0);

    const controlData = [
      { 'Parámetro': 'Fondo Total Asignado', 'Valor (S/)': Number(cajaFondo?.monto_total || 5000).toFixed(2) },
      { 'Parámetro': 'Fondo Disponible Actual', 'Valor (S/)': Number(cajaFondo?.monto_disponible || 0).toFixed(2) },
      { 'Parámetro': 'Total Gastos Aprobados', 'Valor (S/)': totalAprobado.toFixed(2) },
      { 'Parámetro': 'Total Solicitudes en Evaluación (Pendientes)', 'Valor (S/)': totalPendiente.toFixed(2) },
      { 'Parámetro': 'Total Bruto Solicitado', 'Valor (S/)': totalSolicitado.toFixed(2) },
      { 'Parámetro': 'Fecha de Emisión del Reporte', 'Valor (S/)': new Date().toLocaleString('es-PE') },
      { 'Parámetro': 'Generado Por', 'Valor (S/)': usuarioGenerador ? `${usuarioGenerador.nombres} ${usuarioGenerador.apellidos} (${usuarioGenerador.dni})` : 'Sistema PWA' }
    ];

    const wsControl = XLSX.utils.json_to_sheet(controlData);
    wsControl['!cols'] = [{ wch: 45 }, { wch: 30 }];

    // Añadir hojas al libro
    XLSX.utils.book_append_sheet(wb, wsControl, 'Arqueo & Balance');
    XLSX.utils.book_append_sheet(wb, wsMov, 'Libro Caja Chica');
    XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoría');
    XLSX.utils.book_append_sheet(wb, wsSol, 'Por Solicitante');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Reporte_Caja_Chica_${timestamp}.xlsx`;

    return { wb, fileName };
}

export function exportarCajaChicaExcel(solicitudes, cajaFondo, usuarioGenerador) {
  try {
    const { wb, fileName } = generarCajaChicaWorkbook(solicitudes, cajaFondo, usuarioGenerador);
    XLSX.writeFile(wb, fileName);
    return { success: true, fileName };
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
}
