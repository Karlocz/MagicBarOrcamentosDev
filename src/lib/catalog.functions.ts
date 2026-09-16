import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const PUBLIC_SETTINGS_COLUMNS =
  "base_4_drinks, base_5_drinks, base_6_drinks, purple_1_drink, purple_2_plus_drinks, blue_1_drink, blue_2_plus_drinks, green_initial_price, green_increment, glass_rental_per_person, child_percentage, minimum_drinks, maximum_drinks, minimum_freight, freight_per_km, freight_included_km, maximum_distance_km, origin_address, whatsapp_number, minimum_guests, tasting_price_per_person, pix_key, pix_qr_url, payment_whatsapp_number, tasting_payment_link";

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [drinks, settings] = await Promise.all([
    supabase
      .from("drinks")
      .select("id, name, base_spirits, ingredients, category, image_url, sort_order")
      .eq("active", true)
      .order("category")
      .order("sort_order"),
    (async () => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return supabaseAdmin.from("app_settings").select(PUBLIC_SETTINGS_COLUMNS).eq("id", 1).maybeSingle();
    })(),
  ]);
  if (drinks.error) throw drinks.error;
  if (settings.error) throw settings.error;
  return { drinks: drinks.data ?? [], settings: settings.data };
});

const addressSchema = z.object({
  address: z.string().trim().min(3).max(200),
  number: z.string().trim().max(20).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(40),
  cep: z.string().trim().max(20).optional(),
});

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function geocode(data: z.infer<typeof addressSchema>) {
  const { geocodeAddress } = await import("./geocode.server");
  return geocodeAddress(data);
}

async function ufOf(value: string) {
  const { toUf } = await import("./geocode.server");
  return toUf(value);
}

/** Real driving route via OSRM; null when routing is unavailable. */
async function drivingRoute(
  a: [number, number],
  b: [number, number],
): Promise<{ km: number; minutes: number } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      code?: string;
      routes?: Array<{ distance?: number; duration?: number }>;
    };
    const route = json.code === "Ok" ? json.routes?.[0] : undefined;
    const meters = route?.distance;
    if (typeof meters !== "number" || !Number.isFinite(meters)) return null;
    return {
      km: meters / 1000,
      minutes: typeof route?.duration === "number" ? Math.round(route.duration / 60) : 0,
    };
  } catch {
    return null;
  }
}

/** Distance + freight are computed server-side against admin-configured settings. */
export const estimateFreight = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => addressSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: settings, error }, { data: areas, error: areasError }] = await Promise.all([
      supabaseAdmin
        .from("app_settings")
        .select(
          "origin_lat, origin_lng, origin_address, origin_number, origin_complement, origin_city, origin_state, origin_cep, minimum_freight, freight_per_km, freight_included_km, maximum_distance_km",
        )
        .eq("id", 1)
        .maybeSingle(),
      supabaseAdmin.from("service_areas").select("state_code, state_name").eq("active", true),
    ]);
    if (error || !settings) throw error ?? new Error("Configurações não encontradas");
    if (areasError) throw areasError;

    const allowed = (areas ?? []).map((a) => a.state_code.toUpperCase().trim());
    const allowedLabel = (areas ?? []).map((a) => `${a.state_name} — ${a.state_code}`).join(", ");
    const maxKm = Number(settings.maximum_distance_km);
    const originStreet = String(settings.origin_address ?? "");
    const originCityLabel =
      settings.origin_city && settings.origin_state
        ? `${settings.origin_city} - ${settings.origin_state}`
        : "";
    const originAddress = [
      originStreet,
      settings.origin_number,
      originCityLabel && !originStreet.toLowerCase().includes(String(settings.origin_city).toLowerCase())
        ? originCityLabel
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    const informedUf = await ufOf(data.state);
    if (informedUf && allowed.length > 0 && !allowed.includes(informedUf)) {
      return {
        ok: false as const,
        reason: "out_of_state" as const,
        city: data.city,
        state: informedUf,
        allowedLabel,
        message:
          "No momento, a MAGIC BAR realiza orçamentos automáticos apenas para eventos localizados no Estado de São Paulo.",
      };
    }

    const hit = await geocode(data);

    if (!hit) {
      return {
        ok: false as const,
        reason: "not_found" as const,
        message: "Não foi possível localizar este endereço. Revise os dados informados.",
      };
    }

    if (hit.uf && allowed.length > 0 && !allowed.includes(hit.uf)) {
      return {
        ok: false as const,
        reason: "out_of_state" as const,
        city: hit.city ?? data.city,
        state: hit.uf,
        allowedLabel,
        message:
          "No momento, a MAGIC BAR realiza orçamentos automáticos apenas para eventos localizados no Estado de São Paulo.",
      };
    }

    const origin: [number, number] = [Number(settings.origin_lat), Number(settings.origin_lng)];
    const route = await drivingRoute(origin, hit.point);
    const rawKm = route?.km ?? haversineKm(origin, hit.point) * 1.25;
    const distanceKm = Math.round(rawKm * 10) / 10;

    if (distanceKm > maxKm) {
      return {
        ok: false as const,
        reason: "out_of_range" as const,
        distanceKm,
        maxKm,
        message: "Este local está acima da distância padrão de atendimento da MAGIC BAR.",
      };
    }

    const { freightForDistance } = await import("@/lib/pricing");
    const freight = freightForDistance(distanceKm, {
      minimum_freight: Number(settings.minimum_freight),
      freight_per_km: Number(settings.freight_per_km),
      freight_included_km: Number(settings.freight_included_km ?? 0),
    } as never);
    return {
      ok: true as const,
      distanceKm,
      durationMinutes: route?.minutes ?? 0,
      freight,
      originAddress,
      origin,
      destination: hit.point,
      destinationLabel: `${hit.city ?? data.city} — ${hit.uf ?? data.state}`,
    };
  });

const QUOTE_STATUS = [
  "draft",
  "sent",
  "tasting_scheduled",
  "payment_pending",
  "tasting_confirmed",
  "contracted",
  "cancelled",
] as const;

const quoteSchema = z.object({
  quote_id: z.string().uuid().nullable().optional(),
  public_token: z.string().trim().max(60).nullable().optional(),
  status: z.enum(QUOTE_STATUS).default("sent"),
  client_name: z.string().trim().min(2).max(120),
  client_cpf: z.string().trim().min(11).max(14),
  event_type: z.string().trim().max(40),
  honoree_names: z.record(z.string().max(120)),
  event_date: z.string().max(20).nullable(),
  buffet_time: z.string().max(10).nullable(),
  bar_time: z.string().max(10).nullable(),
  dj_time: z.string().max(10).nullable(),
  cep: z.string().max(20).nullable(),
  address: z.string().max(200).nullable(),
  address_number: z.string().max(20).nullable(),
  address_complement: z.string().max(120).nullable(),
  city: z.string().max(100).nullable(),
  state: z.string().max(40).nullable(),
  distance_km: z.number().min(0).max(5000).nullable(),
  adults: z.number().int().min(0).max(5000),
  children: z.number().int().min(0).max(5000),
  drink_ids: z.array(z.string().uuid()).max(12),
});

export const saveQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { computeQuote } = await import("@/lib/pricing");
    const { quote_id: quoteId, public_token: token, ...payload } = data;

    const [settingsRes, drinksRes] = await Promise.all([
      supabaseAdmin.from("app_settings").select("*").eq("id", 1).maybeSingle(),
      payload.drink_ids.length
        ? supabaseAdmin
            .from("drinks")
            .select("id, name, category")
            .in("id", payload.drink_ids)
            .eq("active", true)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (settingsRes.error) throw settingsRes.error;
    if (drinksRes.error) throw drinksRes.error;
    const settings = settingsRes.data;
    if (!settings) throw new Error("Configuração indisponível.");

    const minimumGuests = Number(settings.minimum_guests ?? 0);
    if (payload.status !== "draft" && payload.adults + payload.children < minimumGuests) {
      throw new Error(`O orçamento mínimo é para ${minimumGuests} pessoas.`);
    }

    const drinks = (drinksRes.data ?? []) as { id: string; name: string; category: string }[];
    if (drinks.length !== payload.drink_ids.length) {
      throw new Error("Seleção de drinks inválida.");
    }

    const pricingSettings = {
      base_4_drinks: Number(settings.base_4_drinks),
      base_5_drinks: Number(settings.base_5_drinks),
      base_6_drinks: Number(settings.base_6_drinks),
      purple_1_drink: Number(settings.purple_1_drink),
      purple_2_plus_drinks: Number(settings.purple_2_plus_drinks),
      blue_1_drink: Number(settings.blue_1_drink),
      blue_2_plus_drinks: Number(settings.blue_2_plus_drinks),
      green_initial_price: Number(settings.green_initial_price),
      green_increment: Number(settings.green_increment),
      glass_rental_per_person: Number(settings.glass_rental_per_person),
      child_percentage: Number(settings.child_percentage),
      minimum_drinks: Number(settings.minimum_drinks),
      maximum_drinks: Number(settings.maximum_drinks),
      minimum_freight: Number(settings.minimum_freight),
      freight_per_km: Number(settings.freight_per_km),
      freight_included_km: Number(settings.freight_included_km ?? 0),
      maximum_distance_km: Number(settings.maximum_distance_km),
    };

    const distanceKm =
      payload.distance_km != null && payload.distance_km <= pricingSettings.maximum_distance_km
        ? payload.distance_km
        : null;

    const math = computeQuote({
      categories: drinks.map((drink) => drink.category) as never,
      adults: payload.adults,
      children: payload.children,
      distanceKm,
      settings: pricingSettings,
    });

    const row = {
      ...payload,
      distance_km: distanceKm,
      drink_names: drinks.map((drink) => drink.name),
      applied_category: math.appliedCategory,
      price_per_person: math.pricePerPerson,
      glass_rental: math.glassRental,
      adults_total: math.adultsTotal,
      children_total: math.childrenTotal,
      freight: math.freight,
      total: math.total,
    };

    if (quoteId && token) {
      const { data: updated, error } = await supabaseAdmin
        .from("quotes")
        .update(row as never)
        .eq("id", quoteId)
        .eq("public_token", token)
        .select("id, public_token")
        .maybeSingle();
      if (error) throw error;
      if (updated) return { id: updated.id, public_token: updated.public_token as string };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("quotes")
      .insert(row as never)
      .select("id, public_token")
      .single();
    if (error) throw error;
    return { id: inserted.id, public_token: inserted.public_token as string };
  });
