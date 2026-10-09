import * as XLSX from 'xlsx';

export const NOMBRE_EMPRESA = 'CORPORACION CADILLO & ROJO SAC';

export function getMontoLiquidado(item) {
  if (item.rendiciones) {
    try {
      const r = typeof item.rendiciones === 'string' ? JSON.parse(item.rendiciones) : item.rendiciones;
      if (Array.isArray(r) && r.length > 0) {
        const sum = r.reduce((acc, x) => acc + Number(x.monto || 0), 0);
        if (sum > 0) return sum;
      }
    } catch {}
  }
  return Number(item.monto || 0);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return new Date().toLocaleDateString('es-PE');
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return String(fechaStr);
  return d.toLocaleDateString('es-PE');
}

function normalizarTipoComprobante(tipo) {
  if (!tipo) return 'RECIBO';
  const t = String(tipo).toUpperCase().trim().replace(/_/g, ' ');
  if (t.includes('FACTURA')) return 'FACTURA';
  if (t.includes('BOLETA')) return 'BOLETA';
  if (t.includes('HONORARIO') || t.includes('RECIBO')) return 'RECIBO';
  if (t.includes('TICKET')) return 'TICKET';
  if (t.includes('DECLARACION') || t.includes('JURADA')) return 'DECLARACIÓN JURADA';
  if (t.includes('NOTA')) return 'NOTA DE VENTA';
  return t;
}

/**
 * Desglosa todas las solicitudes en items individuales de comprobantes
 */
export function extraerDetalleComprobantes(solicitudes) {
  const items = [];

  solicitudes.forEach((sol) => {
    let tieneRendiciones = false;

    if (sol.rendiciones) {
      try {
        const rList = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
        if (Array.isArray(rList) && rList.length > 0) {
          tieneRendiciones = true;
          rList.forEach((r) => {
            items.push({
              solicitud_id: sol.id,
              solicitud_codigo: sol.codigo,
              solicitante_dni: sol.solicitante_dni,
              solicitante_nombre: sol.solicitante_nombre,
              solicitante_cargo: sol.solicitante_cargo || sol.cargo || '-',
              solicitante_area: sol.solicitante_area || sol.area || sol.centro_costo || 'ADMINISTRACIÓN',
              fecha: formatearFecha(r.fecha || sol.fecha_gasto || sol.created_at),
              tipo: normalizarTipoComprobante(r.tipo || sol.comprobante_tipo),
              numero: r.numero || sol.comprobante_numero || '-',
              razonSocial: (r.razonSocial || r.proveedor || sol.comprobante_razon_social || (r.ruc ? `RUC ${r.ruc}` : sol.solicitante_nombre || '-')).toUpperCase(),
              descripcion: (r.concepto || r.descripcion || sol.motivo || '-').toUpperCase(),
              centroCosto: (r.centro_costo || sol.centro_costo || 'ADMINISTRACIÓN').toUpperCase(),
              monto: Number(r.monto || 0),
              estado: sol.estado,
              liquidacion_codigo: sol.liquidacion_codigo
            });
          });
        }
      } catch (e) {
        console.error('Error parseando rendiciones para excel:', e);
      }
    }

    if (!tieneRendiciones) {
      const montoFinal = getMontoLiquidado(sol);
      items.push({
        solicitud_id: sol.id,
        solicitud_codigo: sol.codigo,
        solicitante_dni: sol.solicitante_dni,
        solicitante_nombre: sol.solicitante_nombre,
        solicitante_cargo: sol.solicitante_cargo || sol.cargo || '-',
        solicitante_area: sol.solicitante_area || sol.area || sol.centro_costo || 'ADMINISTRACIÓN',
        fecha: formatearFecha(sol.fecha_gasto || sol.created_at),
        tipo: normalizarTipoComprobante(sol.comprobante_tipo),
        numero: sol.comprobante_numero || '-',
        razonSocial: (sol.comprobante_razon_social || (sol.comprobante_ruc_emisor ? `RUC ${sol.comprobante_ruc_emisor}` : sol.solicitante_nombre || '-')).toUpperCase(),
        descripcion: (sol.motivo || '-').toUpperCase(),
        centroCosto: (sol.centro_costo || 'ADMINISTRACIÓN').toUpperCase(),
        monto: Number(montoFinal || 0),
        estado: sol.estado,
        liquidacion_codigo: sol.liquidacion_codigo
      });
    }
  });

  return items;
}

export function generarCajaChicaWorkbook(solicitudes, cajaFondo, usuarioGenerador, customFileName = null) {
  const wb = XLSX.utils.book_new();

  // Extraer todos los comprobantes individuales
  const comprobantes = extraerDetalleComprobantes(solicitudes);

  // Determinar metadatos para el encabezado
  const primerItem = comprobantes[0] || {};
  const mismoSolicitante = comprobantes.length > 0 && comprobantes.every(c => c.solicitante_dni === primerItem.solicitante_dni);
  
  let areaText = 'ADMINISTRACIÓN';
  if (mismoSolicitante && primerItem.solicitante_area) {
    areaText = primerItem.solicitante_area.toUpperCase();
  } else if (usuarioGenerador?.area) {
    areaText = usuarioGenerador.area.toUpperCase();
  }

  let liqCodigo = `001-${new Date().getFullYear()}`;
  const liqEncontrada = solicitudes.find(s => s.liquidacion_codigo)?.liquidacion_codigo;
  if (liqEncontrada) {
    liqCodigo = liqEncontrada;
  }

  let nombreText = 'VARIOS SOLICITANTES';
  let cargoText = 'ADMINISTRACIÓN';
  if (mismoSolicitante && primerItem.solicitante_nombre) {
    nombreText = primerItem.solicitante_nombre.toUpperCase();
    cargoText = (primerItem.solicitante_cargo && primerItem.solicitante_cargo !== '-') 
      ? primerItem.solicitante_cargo.toUpperCase() 
      : 'PERSONAL AUTORIZADO';
  } else if (usuarioGenerador) {
    nombreText = `${usuarioGenerador.nombres || ''} ${usuarioGenerador.apellidos || ''}`.trim().toUpperCase();
    cargoText = (usuarioGenerador.cargo || 'RESPONSABLE DE CAJA').toUpperCase();
  }

  // 1. Hoja "Libro Caja Chica" con la estructura oficial solicitada
  const aoaLibroCajaChica = [
    [], // Fila 1 (margen)
    // Fila 2: Título Principal Centrado
    [`LIQUIDACIÓN DEL FONDO DE CAJA CHICA DE ${NOMBRE_EMPRESA}`, '', '', '', '', '', '', ''],
    // Fila 3: Area y Código de Liquidación
    [`Area :`, areaText, '', '', '', `LIQUIDACION CAJA N.°: ${liqCodigo}`, '', ''],
    // Fila 4: Nombre del Responsable y Cargo
    [`Nombre y Apellidos:`, nombreText, '', '', '', `Cargo: ${cargoText}`, '', ''],
    // Fila 5: Encabezados de Columna
    ['N°', 'Fecha', 'Tipo', 'Nro. De Comprobante', 'Razón Social', 'Descripción', 'Centro de Costos', 'Importe S/']
  ];

  let totalImporte = 0;
  comprobantes.forEach((comp, idx) => {
    totalImporte += comp.monto;
    aoaLibroCajaChica.push([
      idx + 1,
      comp.fecha,
      comp.tipo,
      comp.numero,
      comp.razonSocial,
      comp.descripcion,
      comp.centroCosto,
      Number(comp.monto.toFixed(2))
    ]);
  });

  // Fila de Total
  aoaLibroCajaChica.push([
    '', '', '', '', '', '', 'TOTAL', Number(totalImporte.toFixed(2))
  ]);

  const wsLibro = XLSX.utils.aoa_to_sheet(aoaLibroCajaChica);

  // Merges idénticos a la plantilla de la imagen
  wsLibro['!merges'] = [
    // Fila 2 (A2:H2) -> Título corporativo
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    // Fila 3 (B3:E3) -> Área
    { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
    // Fila 3 (F3:H3) -> Liquidación Caja N.°
    { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } },
    // Fila 4 (B4:E4) -> Nombre y Apellidos
    { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } },
    // Fila 4 (F4:H4) -> Cargo
    { s: { r: 3, c: 5 }, e: { r: 3, c: 7 } }
  ];

  // Anchos óptimos de columna para visualización profesional
  wsLibro['!cols'] = [
    { wch: 6 },  // A: N°
    { wch: 14 }, // B: Fecha
    { wch: 14 }, // C: Tipo
    { wch: 22 }, // D: Nro. De Comprobante
    { wch: 42 }, // E: Razón Social
    { wch: 48 }, // F: Descripción
    { wch: 26 }, // G: Centro de Costos
    { wch: 16 }  // H: Importe S/
  ];

  // 2. Hoja de Arqueo y Control General
  const totalSolicitado = solicitudes.reduce((acc, cur) => acc + getMontoLiquidado(cur), 0);
  const totalAprobado = solicitudes.filter(s => ['APROBADO', 'RENDIDO', 'LIQUIDADO', 'PAGADO', 'POR_RENDIR', 'POR_REEMBOLSAR', 'POR_DEVOLVER'].includes(s.estado)).reduce((acc, cur) => acc + getMontoLiquidado(cur), 0);
  const totalPendiente = solicitudes.filter(s => ['PENDIENTE', 'PENDIENTE_REEMBOLSO'].includes(s.estado)).reduce((acc, cur) => acc + getMontoLiquidado(cur), 0);

  const controlData = [
    { 'Parámetro': 'Empresa', 'Valor (S/)': NOMBRE_EMPRESA },
    { 'Parámetro': 'Sistema', 'Valor (S/)': `CAJA CHICA ${NOMBRE_EMPRESA}` },
    { 'Parámetro': 'Fondo Total Asignado', 'Valor (S/)': Number(cajaFondo?.monto_total || 500).toFixed(2) },
    { 'Parámetro': 'Fondo Disponible Actual', 'Valor (S/)': Number(cajaFondo?.monto_disponible || 0).toFixed(2) },
    { 'Parámetro': 'Total Gastos Aprobados / Liquidados', 'Valor (S/)': totalAprobado.toFixed(2) },
    { 'Parámetro': 'Total Solicitudes en Evaluación (Pendientes)', 'Valor (S/)': totalPendiente.toFixed(2) },
    { 'Parámetro': 'Total Bruto Solicitado', 'Valor (S/)': totalSolicitado.toFixed(2) },
    { 'Parámetro': 'Fecha de Emisión del Reporte', 'Valor (S/)': new Date().toLocaleString('es-PE') },
    { 'Parámetro': 'Generado Por', 'Valor (S/)': usuarioGenerador ? `${usuarioGenerador.nombres} ${usuarioGenerador.apellidos} (${usuarioGenerador.dni})` : 'Sistema en tiempo real' }
  ];

  const wsControl = XLSX.utils.json_to_sheet(controlData);
  wsControl['!cols'] = [{ wch: 45 }, { wch: 35 }];

  // 3. Hoja de Resumen por Categoría
  const catTotales = {};
  solicitudes.forEach(s => {
    const cat = (s.categoria || 'OTROS').replace(/_/g, ' ');
    const m = getMontoLiquidado(s);
    if (!catTotales[cat]) {
      catTotales[cat] = { 'Categoría de Gasto': cat, 'Total S/': 0, 'Total Comprobantes': 0, 'Aprobados S/': 0 };
    }
    catTotales[cat]['Total S/'] += m;
    catTotales[cat]['Total Comprobantes'] += 1;
    if (['APROBADO', 'RENDIDO', 'LIQUIDADO', 'PAGADO', 'POR_RENDIR', 'POR_REEMBOLSAR', 'POR_DEVOLVER'].includes(s.estado)) {
      catTotales[cat]['Aprobados S/'] += m;
    }
  });

  const wsCat = XLSX.utils.json_to_sheet(Object.values(catTotales));
  wsCat['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];

  // 4. Hoja de Resumen por Solicitante
  const solTotales = {};
  solicitudes.forEach(s => {
    const dni = s.solicitante_dni || '-';
    const nom = s.solicitante_nombre || '-';
    const m = getMontoLiquidado(s);
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
    if (['APROBADO', 'RENDIDO', 'LIQUIDADO', 'PAGADO', 'POR_RENDIR', 'POR_REEMBOLSAR', 'POR_DEVOLVER'].includes(s.estado)) {
      solTotales[dni]['Total Aprobado S/'] += m;
    }
    solTotales[dni]['Registros'] += 1;
  });

  const wsSol = XLSX.utils.json_to_sheet(Object.values(solTotales));
  wsSol['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];

  // Añadir hojas al libro (Libro Caja Chica como hoja principal)
  XLSX.utils.book_append_sheet(wb, wsLibro, 'Libro Caja Chica');
  XLSX.utils.book_append_sheet(wb, wsControl, 'Arqueo & Balance');
  XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoría');
  XLSX.utils.book_append_sheet(wb, wsSol, 'Por Solicitante');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanEmpresa = NOMBRE_EMPRESA.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = customFileName ? `${customFileName}.xlsx` : `Liquidacion_Caja_Chica_${cleanEmpresa}_${timestamp}.xlsx`;

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

