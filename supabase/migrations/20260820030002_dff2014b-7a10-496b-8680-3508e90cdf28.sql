-- drinks
DROP POLICY IF EXISTS "active drinks are public" ON public.drinks;
CREATE POLICY "active drinks are public"
ON public.drinks FOR SELECT TO anon, authenticated USING (active);

DROP POLICY IF EXISTS "admins manage drinks" ON public.drinks;
CREATE POLICY "admins manage drinks"
ON public.drinks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- app_settings
DROP POLICY IF EXISTS "admins read settings" ON public.app_settings;
CREATE POLICY "admins read settings"
ON public.app_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

DROP POLICY IF EXISTS "admins update settings" ON public.app_settings;
CREATE POLICY "admins update settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- quotes
DROP POLICY IF EXISTS "admins read quotes" ON public.quotes;
CREATE POLICY "admins read quotes"
ON public.quotes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

DROP POLICY IF EXISTS "admins delete quotes" ON public.quotes;
CREATE POLICY "admins delete quotes"
ON public.quotes FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));