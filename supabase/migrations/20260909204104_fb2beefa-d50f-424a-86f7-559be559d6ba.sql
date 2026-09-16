-- 1) QUOTES: status, token público, updated_at
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS public_token text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.quotes SET public_token = encode(gen_random_bytes(9), 'hex') WHERE public_token IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN public_token SET NOT NULL,
  ALTER COLUMN public_token SET DEFAULT encode(gen_random_bytes(9), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS quotes_public_token_key ON public.quotes (public_token);

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check CHECK (status IN (
    'draft','sent','tasting_scheduled','payment_pending','tasting_confirmed','contracted','cancelled'
  ));

CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) NOMES NEUTROS: migra noivo/noiva -> partner_1/partner_2 preservando os dados
UPDATE public.quotes
SET honoree_names = (honoree_names - 'noivo' - 'noiva')
  || jsonb_strip_nulls(jsonb_build_object(
       'partner_1', honoree_names->>'noivo',
       'partner_2', honoree_names->>'noiva'))
WHERE honoree_names ? 'noivo' OR honoree_names ? 'noiva';

-- 3) CONFIGURAÇÕES: frete base + km incluídos, link de pagamento, agenda padrão
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS freight_included_km numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS tasting_payment_link text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tasting_start_time text NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS tasting_end_time text NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS tasting_interval_minutes integer NOT NULL DEFAULT 30;

-- 4) AGENDA DE DEGUSTAÇÃO
CREATE TABLE IF NOT EXISTS public.tasting_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  start_time text NOT NULL DEFAULT '09:00',
  end_time text NOT NULL DEFAULT '18:00',
  interval_minutes integer NOT NULL DEFAULT 30,
  blocked_times text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tasting_availability TO authenticated;
GRANT ALL ON public.tasting_availability TO service_role;
ALTER TABLE public.tasting_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tasting availability" ON public.tasting_availability
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER tasting_availability_updated_at BEFORE UPDATE ON public.tasting_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.tasting_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  date date NOT NULL,
  time text NOT NULL,
  people integer NOT NULL DEFAULT 1 CHECK (people > 0 AND people <= 50),
  price_per_person numeric NOT NULL DEFAULT 0 CHECK (price_per_person >= 0),
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0),
  client_name text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tasting_appointments TO authenticated;
GRANT ALL ON public.tasting_appointments TO service_role;
ALTER TABLE public.tasting_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tasting appointments" ON public.tasting_appointments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE TRIGGER tasting_appointments_updated_at BEFORE UPDATE ON public.tasting_appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Proteção no banco contra reserva duplicada de data + horário
CREATE UNIQUE INDEX IF NOT EXISTS tasting_appointments_slot_key
  ON public.tasting_appointments (date, time)
  WHERE status <> 'cancelled';

-- Datas iniciais da agenda (administráveis)
INSERT INTO public.tasting_availability (date) VALUES ('2026-10-04'), ('2026-10-05')
ON CONFLICT (date) DO NOTHING;