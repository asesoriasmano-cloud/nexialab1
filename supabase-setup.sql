-- ============================================================
-- SQL para crear tabla de reportes en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Tabla de reportes
CREATE TABLE IF NOT EXISTS reportes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  grupo TEXT NOT NULL,
  esquema TEXT DEFAULT '',
  fecha_corte TEXT DEFAULT '',
  fecha_corte_ms TEXT DEFAULT '',
  periodo TEXT NOT NULL,
  datos JSONB NOT NULL DEFAULT '{}',
  mensaje TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Un reporte por RUT por periodo
CREATE UNIQUE INDEX IF NOT EXISTS idx_reportes_rut_periodo
  ON reportes(rut, periodo);

-- 2. Row Level Security: solo lectura para anon key
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo lectura publica" ON reportes
  FOR SELECT USING (true);

-- NO hay politicas de INSERT/UPDATE/DELETE para anon
-- Las escrituras van exclusivamente por la funcion RPC

-- 3. Funcion RPC para escritura segura (SECURITY DEFINER = bypassa RLS)
-- La clave admin protege contra escrituras no autorizadas
-- Puedes cambiar 'fhc_admin_2026' por la clave que quieras
CREATE OR REPLACE FUNCTION upsert_reporte(
  admin_key TEXT,
  p_rut TEXT,
  p_nombre TEXT,
  p_telefono TEXT DEFAULT '',
  p_grupo TEXT DEFAULT '',
  p_esquema TEXT DEFAULT '',
  p_fecha_corte TEXT DEFAULT '',
  p_fecha_corte_ms TEXT DEFAULT '',
  p_periodo TEXT DEFAULT '',
  p_datos JSONB DEFAULT '{}',
  p_mensaje TEXT DEFAULT ''
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF admin_key IS NULL OR admin_key != 'fhc_admin_2026' THEN
    RAISE EXCEPTION 'Acceso denegado: clave admin invalida';
  END IF;

  INSERT INTO reportes (rut, nombre, telefono, grupo, esquema, fecha_corte, fecha_corte_ms, periodo, datos, mensaje, updated_at)
  VALUES (p_rut, p_nombre, p_telefono, p_grupo, p_esquema, p_fecha_corte, p_fecha_corte_ms, p_periodo, p_datos, p_mensaje, NOW())
  ON CONFLICT (rut, periodo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    grupo = EXCLUDED.grupo,
    esquema = EXCLUDED.esquema,
    fecha_corte = EXCLUDED.fecha_corte,
    fecha_corte_ms = EXCLUDED.fecha_corte_ms,
    datos = EXCLUDED.datos,
    mensaje = EXCLUDED.mensaje,
    updated_at = NOW();
END;
$$;
