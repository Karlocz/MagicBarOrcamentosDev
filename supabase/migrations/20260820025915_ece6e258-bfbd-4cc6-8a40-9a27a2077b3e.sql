-- Restrict app_settings public read access
DROP POLICY IF EXISTS "settings are public" ON public.app_settings;

CREATE POLICY "admins read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.app_settings FROM anon;
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- Lock down SECURITY DEFINER functions from direct API calls
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;