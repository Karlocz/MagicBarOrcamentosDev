-- 1. quotes: remove open public insert; only trusted server code inserts
DROP POLICY IF EXISTS "anyone can submit a quote" ON public.quotes;
REVOKE INSERT ON public.quotes FROM anon, authenticated;
GRANT ALL ON public.quotes TO service_role;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_adults_range CHECK (adults >= 0 AND adults <= 5000),
  ADD CONSTRAINT quotes_children_range CHECK (children >= 0 AND children <= 5000),
  ADD CONSTRAINT quotes_drinks_limit CHECK (array_length(drink_ids, 1) IS NULL OR array_length(drink_ids, 1) <= 12),
  ADD CONSTRAINT quotes_money_nonneg CHECK (
    coalesce(price_per_person, 0) >= 0 AND coalesce(glass_rental, 0) >= 0
    AND coalesce(adults_total, 0) >= 0 AND coalesce(children_total, 0) >= 0
    AND coalesce(freight, 0) >= 0 AND coalesce(total, 0) >= 0
  );

-- 2. user_roles: explicit deny of any client-side role assignment
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "no client role inserts" ON public.user_roles;
CREATE POLICY "no client role inserts" ON public.user_roles
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "no client role updates" ON public.user_roles;
CREATE POLICY "no client role updates" ON public.user_roles
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "no client role deletes" ON public.user_roles;
CREATE POLICY "no client role deletes" ON public.user_roles
  FOR DELETE TO anon, authenticated USING (false);