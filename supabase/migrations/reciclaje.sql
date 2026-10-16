-- ============================================================================
-- MIGRACIÓN PARA MÓDULO DE RECICLAJE (VENTA DE CARTÓN Y MATERIALES)
-- Archivo: supabase/migrations/reciclaje.sql
-- Propósito: Estructura idempotente para soportar rol RECICLAJE, registro de
--            ventas, recepción física de dinero en Caja Chica y trazabilidad.
-- Reglas: Solo CREATE TABLE IF NOT EXISTS y ADD COLUMN IF NOT EXISTS.
--         Sin DROP, DELETE ni UPDATE sobre datos existentes. 100% Idempotente.
-- ============================================================================

-- 1. Tabla de Solicitudes y Movimientos de Caja Chica
-- (Crea la tabla si no existe previamente)
CREATE TABLE IF NOT EXISTS public.solicitudes (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    tipo VARCHAR(30) NOT NULL, -- 'ADELANTO_DINERO' | 'RENDICION_GASTO' | 'INGRESO_RECICLAJE'
    solicitante_dni VARCHAR(15) NOT NULL,
    solicitante_nombre VARCHAR(200) NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    moneda VARCHAR(5) NOT NULL DEFAULT 'PEN',
    motivo TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'RECICLAJE',
    centro_costo VARCHAR(50) NOT NULL DEFAULT 'ALMACEN',
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_RECEPCION', -- 'PENDIENTE_RECEPCION', 'INGRESADO_CAJA', 'ANULADO'
    comprobante_tipo VARCHAR(40) DEFAULT 'TICKET_RECICLAJE',
    comprobante_numero VARCHAR(50),
    comprobante_ruc_emisor VARCHAR(20) DEFAULT '-',
    comprobante_razon_social VARCHAR(200),
    comprobante_fecha DATE,
    comprobante_archivo_url TEXT,
    rendiciones JSONB DEFAULT '[]'::jsonb,
    aprobado_por_dni VARCHAR(15),
    aprobado_por_nombre VARCHAR(200),
    aprobado_fecha TIMESTAMPTZ,
    observaciones_aprobador TEXT,
    pagado_por_dni VARCHAR(15),
    pagado_por_nombre VARCHAR(200),
    pagado_fecha TIMESTAMPTZ,
    abono_sustento_url TEXT,
    abono_sustento_nombre VARCHAR(200),
    abono_metodo VARCHAR(50) DEFAULT 'Efectivo en Caja',
    abono_operacion VARCHAR(60),
    abono_observacion TEXT,
    abono_fecha TIMESTAMPTZ,
    rendicion_fecha TIMESTAMPTZ,
    rendido_por_dni VARCHAR(15),
    rendido_por_nombre VARCHAR(200),
    liquidacion_codigo VARCHAR(30),
    liquidado_fecha TIMESTAMPTZ,
    liquidado_por_dni VARCHAR(15),
    liquidado_por_nombre VARCHAR(200),
    abono_destinatario_tipo VARCHAR(20) DEFAULT 'A_MI',
    abono_banco VARCHAR(50),
    abono_cuenta_numero VARCHAR(100),
    abono_titular VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columnas necesarias en bases de datos existentes sin tocar datos
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) DEFAULT 'RENDICION_GASTO';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'OTROS';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS centro_costo VARCHAR(50) DEFAULT 'CC-GENERAL';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_tipo VARCHAR(40);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_numero VARCHAR(50);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_ruc_emisor VARCHAR(20) DEFAULT '-';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_razon_social VARCHAR(200);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_fecha DATE;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_archivo_url TEXT;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS rendiciones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS estado VARCHAR(30) DEFAULT 'PENDIENTE';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS observaciones_aprobador TEXT;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS pagado_por_dni VARCHAR(15);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS pagado_por_nombre VARCHAR(200);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS pagado_fecha TIMESTAMPTZ;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS abono_sustento_url TEXT;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS abono_sustento_nombre VARCHAR(200);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS abono_metodo VARCHAR(50) DEFAULT 'Efectivo en Caja';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS abono_operacion VARCHAR(60);
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS abono_observacion TEXT;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS abono_fecha TIMESTAMPTZ;

-- 2. Tabla de Fondo de Caja Chica (Control de saldo disponible tras recepción de ventas)
CREATE TABLE IF NOT EXISTS public.caja_fondo (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL DEFAULT 'CAJA CHICA DICAR LOGISTIC',
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    monto_disponible NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
    responsable_dni VARCHAR(15),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.caja_fondo ADD COLUMN IF NOT EXISTS nombre VARCHAR(100) DEFAULT 'CAJA CHICA DICAR LOGISTIC';
ALTER TABLE public.caja_fondo ADD COLUMN IF NOT EXISTS monto_total NUMERIC(12, 2) DEFAULT 500.00;
ALTER TABLE public.caja_fondo ADD COLUMN IF NOT EXISTS monto_disponible NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.caja_fondo ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'ABIERTA';
ALTER TABLE public.caja_fondo ADD COLUMN IF NOT EXISTS responsable_dni VARCHAR(15);

-- 3. Tabla de Usuarios y Roles (Permite rol RECICLAJE en la lista de roles)
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

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['SOLICITANTE']::TEXT[];
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 4. Tabla de Auditoría (Registro de auditoría de ventas, recepciones y anulaciones)
CREATE TABLE IF NOT EXISTS public.auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_dni VARCHAR(15),
    usuario_nombre VARCHAR(150),
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) DEFAULT 'CAJA',
    codigo VARCHAR(50),
    entidad_id VARCHAR(50),
    detalle TEXT,
    tipo VARCHAR(20) DEFAULT 'INFO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) DEFAULT 'CAJA';
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS entidad_id VARCHAR(50);
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS detalle TEXT;
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'INFO';

-- 5. Tabla de Notificaciones en Vivo
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_dni VARCHAR(30) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'INFO',
    referencia_id VARCHAR(50),
    leido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- HABILITACIÓN DE ROW LEVEL SECURITY (RLS) Y POLÍTICAS COHERENTES E IDEMPOTENTES
-- ============================================================================
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_fondo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'solicitudes' AND policyname = 'Acceso total solicitudes'
    ) THEN
        CREATE POLICY "Acceso total solicitudes" ON public.solicitudes FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'caja_fondo' AND policyname = 'Acceso total caja_fondo'
    ) THEN
        CREATE POLICY "Acceso total caja_fondo" ON public.caja_fondo FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usuarios' AND policyname = 'Acceso total usuarios'
    ) THEN
        CREATE POLICY "Acceso total usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'auditoria' AND policyname = 'Acceso total auditoria'
    ) THEN
        CREATE POLICY "Acceso total auditoria" ON public.auditoria FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notificaciones' AND policyname = 'Acceso total notificaciones'
    ) THEN
        CREATE POLICY "Acceso total notificaciones" ON public.notificaciones FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- INTEGRACIÓN A SUPABASE REALTIME (IDEMPOTENTE)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'solicitudes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'caja_fondo'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.caja_fondo;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notificaciones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
    END IF;
END $$;
