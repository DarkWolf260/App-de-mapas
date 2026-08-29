-- =====================================================================
-- SCRIPT DE OPTIMIZACIÓN DE BASE DE DATOS Y REALTIME EN SUPABASE
-- =====================================================================

-- 1. Habilitar la publicación supabase_realtime para todas las tablas operacionales
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.drawn_features; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.novedades; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.campamentos; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pizarra_operacional; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_activities; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- 2. Asegurar la integridad referencial entre daily_logs y drawn_features (ON DELETE CASCADE)
-- 2. Permitir registros libres en daily_logs (ej. featureId 100 de Pizarra Operacional)
-- Se eliminan restricciones FK estrictas para permitir equipos de trabajo virtuales e independientes
ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_feature_id_fkey;
ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS fk_daily_logs_feature;

-- 3. Índices de rendimiento para consultas por fecha, departamento y feature_id
CREATE INDEX IF NOT EXISTS idx_daily_logs_lookup ON public.daily_logs(feature_id, date, department);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date_dept ON public.daily_logs(date, department);
CREATE INDEX IF NOT EXISTS idx_novedades_date_dept ON public.novedades(date, department);
CREATE INDEX IF NOT EXISTS idx_campamentos_date ON public.campamentos(date);
CREATE INDEX IF NOT EXISTS idx_pizarra_record_date ON public.pizarra_operacional(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON public.daily_activities(date);

-- 4. Asegurar Replica Identity FULL para que los eventos DELETE de Realtime envíen la fila completa
ALTER TABLE public.drawn_features REPLICA IDENTITY FULL;
ALTER TABLE public.daily_logs REPLICA IDENTITY FULL;
ALTER TABLE public.novedades REPLICA IDENTITY FULL;
ALTER TABLE public.campamentos REPLICA IDENTITY FULL;
ALTER TABLE public.pizarra_operacional REPLICA IDENTITY FULL;
ALTER TABLE public.daily_activities REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
