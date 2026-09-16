CREATE TABLE public.service_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_name text NOT NULL,
  state_code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_areas TO authenticated;
GRANT ALL ON public.service_areas TO service_role;

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage service areas" ON public.service_areas FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER service_areas_updated_at BEFORE UPDATE ON public.service_areas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.service_areas (state_name, state_code, active) VALUES ('São Paulo', 'SP', true);

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS origin_cep text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origin_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origin_complement text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origin_city text NOT NULL DEFAULT 'São Paulo',
  ADD COLUMN IF NOT EXISTS origin_state text NOT NULL DEFAULT 'SP';