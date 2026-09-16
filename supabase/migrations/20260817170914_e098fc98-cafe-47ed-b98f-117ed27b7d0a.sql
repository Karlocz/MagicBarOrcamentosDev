-- roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- first signup becomes admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_bootstrap_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- drinks
CREATE TABLE public.drinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_spirits text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  category text NOT NULL CHECK (category IN ('basic','purple','blue','green')),
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drinks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drinks TO authenticated;
GRANT ALL ON public.drinks TO service_role;
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active drinks are public" ON public.drinks FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage drinks" ON public.drinks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER drinks_updated_at BEFORE UPDATE ON public.drinks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- settings
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_4_drinks numeric NOT NULL DEFAULT 29,
  base_5_drinks numeric NOT NULL DEFAULT 30,
  base_6_drinks numeric NOT NULL DEFAULT 31,
  purple_1_drink numeric NOT NULL DEFAULT 35,
  purple_2_plus_drinks numeric NOT NULL DEFAULT 36,
  blue_1_drink numeric NOT NULL DEFAULT 40,
  blue_2_plus_drinks numeric NOT NULL DEFAULT 41,
  green_initial_price numeric NOT NULL DEFAULT 45,
  green_increment numeric NOT NULL DEFAULT 1,
  glass_rental_per_person numeric NOT NULL DEFAULT 3,
  child_percentage numeric NOT NULL DEFAULT 50,
  minimum_drinks integer NOT NULL DEFAULT 4,
  maximum_drinks integer NOT NULL DEFAULT 6,
  minimum_freight numeric NOT NULL DEFAULT 100,
  freight_per_km numeric NOT NULL DEFAULT 3.5,
  maximum_distance_km numeric NOT NULL DEFAULT 120,
  origin_address text NOT NULL DEFAULT 'Av. Paulista, 1000, São Paulo - SP',
  origin_lat numeric NOT NULL DEFAULT -23.5613,
  origin_lng numeric NOT NULL DEFAULT -46.6560,
  served_cities text[] NOT NULL DEFAULT '{}',
  whatsapp_number text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings are public" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.app_settings (id) VALUES (1);

-- quotes
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_cpf text NOT NULL,
  event_type text NOT NULL,
  honoree_names jsonb NOT NULL DEFAULT '{}',
  event_date date,
  buffet_time text,
  bar_time text,
  dj_time text,
  cep text,
  address text,
  address_number text,
  address_complement text,
  city text,
  state text,
  distance_km numeric,
  adults integer NOT NULL DEFAULT 0,
  children integer NOT NULL DEFAULT 0,
  drink_ids uuid[] NOT NULL DEFAULT '{}',
  drink_names text[] NOT NULL DEFAULT '{}',
  applied_category text,
  price_per_person numeric,
  glass_rental numeric,
  adults_total numeric,
  children_total numeric,
  freight numeric,
  total numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.quotes TO anon, authenticated;
GRANT SELECT, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit a quote" ON public.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read quotes" ON public.quotes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete quotes" ON public.quotes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- seed drinks
INSERT INTO public.drinks (name, base_spirits, ingredients, category, sort_order) VALUES
('Tropical','Gin / Vodka','{"Manga","Maracujá","Energético Tropical"}','basic',1),
('Maçã Verde','Gin / Vodka','{"Limão","Energético Maçã Verde"}','basic',2),
('Moranguete','Gin / Vodka','{"Morango","Energético","Melancia"}','basic',3),
('Caipirinha','Velho Barreiro / Vodka / Jurupinga','{"Limão","Rúcula e limão","Morango e limão","Rapadura e limão","Abacaxi e limão"}','basic',4),
('Moscow Mule','Vodka / Gin','{"Limão","Hortelã","Suco de gengibre","Espuma de gengibre"}','basic',5),
('Gin Tônica','Gin','{"Limão","Tônica"}','basic',6),
('Soda Italiana','Sem álcool','{"Morango","Manga","Abacaxi","Limão"}','basic',7),
('Cuba Libre','Rum','{"Suco de limão","Coca-Cola","Limão"}','basic',8),
('Mojito','Rum','{"Limão","Hortelã","Água com gás"}','basic',9),
('Batidinha','Vodka ou Gin','{"Morango","Leite condensado"}','purple',1),
('Sex on the Beach','Vodka','{"Laranja","Groselha","Licor de pêssego"}','purple',2),
('Mimosa','Espumante','{"Suco de laranja"}','purple',3),
('Piña Colada','Rum','{"Suco de abacaxi","Leite de coco","Leite condensado"}','purple',4),
('Espanhola','Vinho','{"Morango","Leite condensado"}','purple',5),
('Cosmopolitan','Vodka','{"Licor de laranja","Suco de limão","Suco de cranberry"}','purple',6),
('Aperol Spritz','Aperol','{"Espumante","Rodela de laranja","Água com gás"}','blue',1),
('Margarita','Tequila','{"Licor de laranja","Limão","Borda de sal"}','blue',2),
('Fitzgerald','Gin','{"Suco de limão siciliano","Hortelã","Xarope de açúcar","Angostura"}','blue',3),
('Negroni','Campari / Gin','{"Vermute tinto","Laranja"}','green',1),
('Old Fashioned','Whiskey','{"Xarope de açúcar","Angostura","Água com gás","Casca de laranja"}','green',2),
('Maracujack','Whiskey','{"Jack Daniel''s Nº 7","Suco de limão","Polpa de maracujá","Soda","Hortelã"}','green',3),
('Penicillin','Whiskey','{"Suco de limão siciliano","Xarope de mel","Fatias de gengibre"}','green',4),
('Manhattan','Bourbon','{"Vermute rosso","Angostura","Calda de cereja","Cereja"}','green',5);