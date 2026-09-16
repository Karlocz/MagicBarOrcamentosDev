import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin({ supabase, userId }: Ctx) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito a administradores.");
}

const settingsSchema = z.object({
  base_4_drinks: z.number().min(0),
  base_5_drinks: z.number().min(0),
  base_6_drinks: z.number().min(0),
  purple_1_drink: z.number().min(0),
  purple_2_plus_drinks: z.number().min(0),
  blue_1_drink: z.number().min(0),
  blue_2_plus_drinks: z.number().min(0),
  green_initial_price: z.number().min(0),
  green_increment: z.number().min(0),
  glass_rental_per_person: z.number().min(0),
  child_percentage: z.number().min(0).max(100),
  minimum_guests: z.number().int().min(1).max(5000),
  tasting_price_per_person: z.number().min(0).max(10000),
  minimum_freight: z.number().min(0),
  freight_per_km: z.number().min(0),
  freight_included_km: z.number().min(0).max(2000),
  maximum_distance_km: z.number().min(0).max(2000),
  tasting_interval_minutes: z.number().int().min(5).max(240),
  whatsapp_number: z.string().trim().max(30),
  payment_whatsapp_number: z.string().trim().max(30),
  pix_key: z.string().trim().max(200),
  pix_qr_url: z.string().trim().max(1_500_000),
  tasting_payment_link: z.string().trim().max(600),
  tasting_start_time: z.string().trim().max(5),
  tasting_end_time: z.string().trim().max(5),
  tasting_address: z.string().trim().max(200),
  tasting_number: z.string().trim().max(20),
  tasting_complement: z.string().trim().max(120),
  tasting_neighborhood: z.string().trim().max(120),
  tasting_city: z.string().trim().max(100),
  tasting_state: z.string().trim().max(2),
  tasting_cep: z.string().trim().max(20),
  origin_cep: z.string().trim().max(20),
  origin_address: z.string().trim().min(3).max(200),
  origin_number: z.string().trim().max(20),
  origin_complement: z.string().trim().max(120),
  origin_city: z.string().trim().min(2).max(100),
  origin_state: z.string().trim().min(2).max(2),
});

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);

    const [settings, drinks, quotes, areas, tastingDates, appointments] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("drinks").select("*").order("category").order("sort_order"),
      supabase
        .from("quotes")
        .select(
          "id, created_at, client_name, client_cpf, event_type, honoree_names, event_date, city, adults, children, drink_names, price_per_person, total, status, public_token, archived_at",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("service_areas").select("*").order("state_name"),
      supabase.from("tasting_availability").select("*").order("date"),
      supabase
        .from("tasting_appointments")
        .select("*")
        .order("date", { ascending: false })
        .limit(200),
    ]);
    if (settings.error) throw settings.error;
    if (drinks.error) throw drinks.error;
    if (quotes.error) throw quotes.error;
    if (areas.error) throw areas.error;
    if (tastingDates.error) throw tastingDates.error;
    if (appointments.error) throw appointments.error;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profilesRes, rolesRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (rolesRes.error) throw rolesRes.error;
    const adminIds = new Set(
      (rolesRes.data ?? []).filter((row) => row.role === "admin").map((row) => row.user_id),
    );

    return {
      settings: settings.data,
      drinks: drinks.data ?? [],
      quotes: quotes.data ?? [],
      serviceAreas: areas.data ?? [],
      tastingDates: tastingDates.data ?? [],
      appointments: appointments.data ?? [],
      currentUserId: context.userId,
      users: (profilesRes.data ?? []).map((profile) => ({
        ...profile,
        is_admin: adminIds.has(profile.id),
      })),
    };
  });

export const getAdminQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ page: z.number().int().min(1), search: z.string().trim().max(120), view: z.enum(["all", "active", "archived"]) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const pageSize = 20;
    let query = context.supabase
      .from("quotes")
      .select("id, created_at, client_name, client_cpf, event_type, honoree_names, event_date, city, adults, children, drink_names, price_per_person, total, status, public_token, archived_at", { count: "exact" });
    if (data.view === "active") query = query.is("archived_at", null);
    if (data.view === "archived") query = query.not("archived_at", "is", null);
    if (data.search) {
      const safe = data.search.replace(/[,%()]/g, " ").trim();
      query = query.or(`client_name.ilike.%${safe}%,client_cpf.ilike.%${safe}%,honoree_names->>partner_1.ilike.%${safe}%,honoree_names->>partner_2.ilike.%${safe}%,honoree_names->>debutante.ilike.%${safe}%,honoree_names->>aniversariante.ilike.%${safe}%`);
      if (/^\d{4}-\d{2}-\d{2}$/.test(safe)) query = query.eq("event_date", safe);
    }
    const from = (data.page - 1) * pageSize;
    const result = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (result.error) throw result.error;
    return { quotes: result.data ?? [], count: result.count ?? 0, pageSize };
  });

/** Only an authenticated admin can grant or revoke the admin role. */
export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ user_id: z.string().uuid(), admin: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    if (data.user_id === context.userId && !data.admin) {
      throw new Error("Você não pode remover o seu próprio acesso de administrador.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.admin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "admin");
      if (error) throw error;
    }
    return { ok: true };
  });

export const toggleServiceArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);
    const { error } = await supabase
      .from("service_areas")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const addServiceArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        state_name: z.string().trim().min(2).max(60),
        state_code: z.string().trim().length(2),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);
    const { error } = await supabase.from("service_areas").insert({
      state_name: data.state_name,
      state_code: data.state_code.toUpperCase(),
      active: true,
    });
    if (error) throw error;
    return { ok: true };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);

    // Geocodifica o ponto de saída para manter a origem das rotas sempre correta.
    const patch: Record<string, unknown> = { ...data, origin_state: data.origin_state.toUpperCase(), tasting_state: data.tasting_state.toUpperCase(), tasting_interval_minutes: 60 };
    const { geocodeAddress } = await import("./geocode.server");
    const hit = await geocodeAddress({
      address: data.origin_address,
      number: data.origin_number,
      city: data.origin_city,
      state: data.origin_state,
      cep: data.origin_cep,
    });
    if (!hit) {
      throw new Error(
        "Não foi possível localizar o endereço de saída. Revise CEP, rua, número e cidade antes de salvar.",
      );
    }
    patch["origin_lat"] = hit.point[0];
    patch["origin_lng"] = hit.point[1];

    const { error } = await supabase.from("app_settings").update(patch as never).eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

export const toggleDrink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);
    const { error } = await supabase
      .from("drinks")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderDrinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      category: z.string().min(1).max(40),
      drink_ids: z.array(z.string().uuid()).min(1).max(200),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);

    const { data: existing, error: readError } = await supabase
      .from("drinks")
      .select("id")
      .eq("category", data.category);
    if (readError) throw readError;

    const existingIds = new Set((existing ?? []).map((row: { id: string }) => row.id));
    const orderedIds = data.drink_ids.filter((id) => existingIds.has(id));
    if (orderedIds.length !== (existing ?? []).length) {
      throw new Error("A ordenação enviada não corresponde aos drinks desta categoria.");
    }

    const firstPass = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("drinks").update({ sort_order: 10000 + index }).eq("id", id),
      ),
    );
    const firstError = firstPass.find((result: { error: unknown }) => result.error)?.error;
    if (firstError) throw firstError;

    const finalPass = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("drinks").update({ sort_order: index }).eq("id", id),
      ),
    );
    const finalError = finalPass.find((result: { error: unknown }) => result.error)?.error;
    if (finalError) throw finalError;

    return { ok: true };
  });

/** Agenda de degustação: datas administráveis (nada de datas fixas no código). */
export const upsertTastingDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        active: z.boolean().default(true),
        start_time: z.string().max(5),
        end_time: z.string().max(5),
        interval_minutes: z.literal(60),
        blocked_times: z.array(z.string().max(5)).max(200).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);
    const { id, ...row } = data;
    if (id) {
      const { error } = await supabase.from("tasting_availability").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("tasting_availability")
        .upsert(row, { onConflict: "date" });
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteTastingDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);
    const { error } = await supabase.from("tasting_availability").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Atualiza uma degustação: status, pagamento ou novo horário. */
export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending_payment", "scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
        payment_status: z.enum(["pending", "paid", "refunded"]).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(context as Ctx);
    const { id, ...patch } = data;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase.from("tasting_appointments").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
