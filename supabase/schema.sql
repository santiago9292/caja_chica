-- ============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA PWA CAJA CHICA CON SUPABASE REALTIME
-- ============================================================================

-- 1. Tabla de Usuarios y Maestro de DNI
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(15) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150),
    telefono VARCHAR(30),
    roles TEXT[] NOT NULL DEFAULT ARRAY['SOLICITANTE']::TEXT[],
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Fondo de Caja Chica (Apertura y Arqueo)
CREATE TABLE IF NOT EXISTS public.caja_fondos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL DEFAULT 'Caja Chica Principal',
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    monto_disponible NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA', -- ABIERTA, CERRADA, EN_ARQUEO
    responsable_dni VARCHAR(15),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Solicitudes y Rendiciones de Caja Chica
CREATE TABLE IF NOT EXISTS public.solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    tipo VARCHAR(30) NOT NULL, -- 'ADELANTO_DINERO' | 'RENDICION_GASTO'
    solicitante_dni VARCHAR(15) NOT NULL,
    solicitante_nombre VARCHAR(200) NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    moneda VARCHAR(5) NOT NULL DEFAULT 'PEN',
    motivo TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'TRANSPORTE', 'ALIMENTACION', 'MATERIALES_OFICINA', 'SERVICIOS_URGENTES', 'REPRESENTACION', 'OTROS'
    
    -- Datos del Comprobante (Relevante para Rendición de Gastos)
    comprobante_tipo VARCHAR(40), -- 'FACTURA', 'BOLETA', 'RECIBO_HONORARIOS', 'TICKET_VALE', 'DECLARACION_JURADA', 'SIN_COMPROBANTE'
    comprobante_numero VARCHAR(50),
    comprobante_ruc_emisor VARCHAR(20),
    comprobante_razon_social VARCHAR(200),
    comprobante_fecha DATE,
    comprobante_archivo_url TEXT, -- Almacena URL o Data URI de la foto/voucher
    
    -- Flujo de Aprobación
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'RENDIDO'
    aprobado_por_dni VARCHAR(15),
    aprobado_por_nombre VARCHAR(200),
    aprobado_fecha TIMESTAMPTZ,
    observaciones_aprobador TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Notificaciones en Vivo (Realtime)
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_dni VARCHAR(30) NOT NULL, -- DNI específico o 'ADMINS' o 'TODOS'
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'DANGER'
    referencia_id VARCHAR(50),
    leido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de Auditoría
CREATE TABLE IF NOT EXISTS public.auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_dni VARCHAR(15),
    usuario_nombre VARCHAR(150),
    accion VARCHAR(100) NOT NULL,
    detalle JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ACTIVAR SUPABASE REALTIME EN LAS TABLAS PRINCIPALES
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'solicitudes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'usuarios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios;
  END IF;
END $$;

-- Permitir lectura y escritura abierta para desarrollo / RLS según conveniencia
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_fondos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total caja_fondos" ON public.caja_fondos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total solicitudes" ON public.solicitudes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total notificaciones" ON public.notificaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total auditoria" ON public.auditoria_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- DATOS SEMILLA (SEED DATA) DE PRUEBA
-- ============================================================================
-- 1. Usuarios con combinaciones de roles
INSERT INTO public.usuarios (dni, nombres, apellidos, correo, telefono, roles, activo)
VALUES 
  ('10203040', 'Carlos Alberto', 'Méndez Ríos', 'carlos.mendez@empresa.com', '987654321', ARRAY['SYSADMIN', 'ADMINISTRADOR']::TEXT[], true),
  ('45678901', 'Ana María', 'Torres Delgado', 'ana.torres@empresa.com', '976543210', ARRAY['ADMINISTRADOR']::TEXT[], true),
  ('78901234', 'Javier Alonso', 'Morales Silva', 'javier.morales@empresa.com', '965432109', ARRAY['SOLICITANTE']::TEXT[], true),
  ('11223344', 'Lucía Fernanda', 'Vargas Paredes', 'lucia.vargas@empresa.com', '954321098', ARRAY['SOLICITANTE', 'USUARIO']::TEXT[], true),
  ('99887766', 'Roberto Andrés', 'Campos Núñez', 'roberto.campos@empresa.com', '943210987', ARRAY['USUARIO']::TEXT[], true),
  ('00112233', 'Diana Sofía', 'Castro Miranda', 'diana.castro@empresa.com', '932109876', ARRAY['SYSADMIN', 'ADMINISTRADOR', 'SOLICITANTE', 'USUARIO']::TEXT[], true)
ON CONFLICT (dni) DO UPDATE 
SET roles = EXCLUDED.roles, nombres = EXCLUDED.nombres, apellidos = EXCLUDED.apellidos;

-- 2. Fondo inicial de Caja Chica
INSERT INTO public.caja_fondos (nombre, monto_total, monto_disponible, estado, responsable_dni)
SELECT 'Fondo Central Operativo 2026', 4500.00, 3850.00, 'ABIERTA', '45678901'
WHERE NOT EXISTS (SELECT 1 FROM public.caja_fondos);

-- 3. Solicitudes de ejemplo
INSERT INTO public.solicitudes (codigo, tipo, solicitante_dni, solicitante_nombre, monto, motivo, categoria, comprobante_tipo, comprobante_numero, comprobante_ruc_emisor, comprobante_razon_social, comprobante_fecha, estado, created_at)
VALUES
  ('SOL-2026-001', 'RENDICION_GASTO', '78901234', 'Javier Alonso Morales Silva', 125.50, 'Taxi para traslado de documentos notariales urgentes', 'TRANSPORTE', 'FACTURA', 'F001-0004523', '20556789123', 'TAXI SEGURO S.A.C.', CURRENT_DATE - INTERVAL '1 day', 'PENDIENTE', NOW() - INTERVAL '3 hours'),
  ('SOL-2026-002', 'ADELANTO_DINERO', '11223344', 'Lucía Fernanda Vargas Paredes', 250.00, 'Adelanto para compra de insumos de cafetería y reunión de directorio', 'ALIMENTACION', 'DECLARACION_JURADA', NULL, NULL, NULL, CURRENT_DATE, 'PENDIENTE', NOW() - INTERVAL '1 hour'),
  ('SOL-2026-003', 'RENDICION_GASTO', '78901234', 'Javier Alonso Morales Silva', 85.00, 'Compra de papel bond y archivadores de palanca', 'MATERIALES_OFICINA', 'BOLETA', 'B002-0012894', '20100458921', 'LIBRERIA CONTINENTAL S.A.C.', CURRENT_DATE - INTERVAL '3 days', 'APROBADO', NOW() - INTERVAL '2 days')
ON CONFLICT (codigo) DO NOTHING;
