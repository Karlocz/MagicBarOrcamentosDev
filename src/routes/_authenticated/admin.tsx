import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandHeader } from "@/components/BrandHeader";
import { CategoryBadge } from "@/components/quote/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  addServiceArea,
  archiveQuote,
  deleteTastingDate,
  getAdminData,
  getAdminQuotes,
  setUserAdmin,
  toggleDrink,
  toggleServiceArea,
  updateAppointment,
  updateQuoteStatus,
  updateSettings,
  upsertTastingDate,
} from "@/lib/admin.functions";
import { formatBRL, type DrinkCategory } from "@/lib/pricing";
import { buildSlots, QUOTE_STATUS_LABEL } from "@/lib/quote-state";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — MAGIC BAR Eventos" },
      {
        name: "description",
        content: "Gerencie preços por categoria, aluguel de taça, frete, cardápio e orçamentos recebidos.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel administrativo — MAGIC BAR Eventos" },
      {
        property: "og:description",
        content: "Gestão de preços, cardápio e orçamentos da MAGIC BAR Eventos.",
      },
    ],
  }),
  component: AdminPage,
});

const FIELDS: Array<{ key: string; label: string; suffix?: string }> = [
  { key: "base_4_drinks", label: "Basic — 4 drinks" },
  { key: "base_5_drinks", label: "Basic — 5 drinks" },
  { key: "base_6_drinks", label: "Basic — 6 drinks" },
  { key: "purple_1_drink", label: "Premium (roxo) — 1 drink" },
  { key: "purple_2_plus_drinks", label: "Premium (roxo) — 2 ou mais" },
  { key: "blue_1_drink", label: "Super Premium (azul) — 1 drink" },
  { key: "blue_2_plus_drinks", label: "Super Premium (azul) — 2 ou mais" },
  { key: "green_initial_price", label: "Whisky (verde) — 1 drink" },
  { key: "green_increment", label: "Whisky (verde) — incremento por drink" },
  { key: "glass_rental_per_person", label: "Aluguel de taça/copo por pessoa" },
  { key: "child_percentage", label: "Percentual criança", suffix: "%" },
  { key: "minimum_guests", label: "Mínimo de pessoas por orçamento", suffix: "pessoas" },
  { key: "tasting_price_per_person", label: "Degustação por pessoa" },
  { key: "minimum_freight", label: "Frete base" },
  { key: "freight_included_km", label: "KM incluídos no frete base", suffix: "km" },
  { key: "freight_per_km", label: "Valor por km excedente" },
  { key: "maximum_distance_km", label: "Distância máxima de atendimento", suffix: "km" },
];

const ORIGIN_FIELDS: Array<{ key: string; label: string; maxLength?: number }> = [
  { key: "origin_cep", label: "CEP", maxLength: 20 },
  { key: "origin_address", label: "Endereço", maxLength: 200 },
  { key: "origin_number", label: "Número", maxLength: 20 },
  { key: "origin_complement", label: "Complemento", maxLength: 120 },
  { key: "origin_city", label: "Cidade", maxLength: 100 },
  { key: "origin_state", label: "Estado (UF)", maxLength: 2 },
];

const PAYMENT_FIELDS: Array<{ key: string; label: string; maxLength?: number }> = [
  { key: "pix_key", label: "Chave Pix para a degustação", maxLength: 200 },
  { key: "payment_whatsapp_number", label: "WhatsApp para envio do comprovante", maxLength: 30 },
  { key: "tasting_payment_link", label: "Link de pagamento da degustação", maxLength: 600 },
  { key: "tasting_start_time", label: "Horário inicial padrão (ex.: 09:00)", maxLength: 5 },
  { key: "tasting_end_time", label: "Horário final padrão (ex.: 18:00)", maxLength: 5 },
];

const TASTING_ADDRESS_FIELDS = [
  { key: "tasting_cep", label: "CEP" }, { key: "tasting_address", label: "Endereço" },
  { key: "tasting_number", label: "Número" }, { key: "tasting_complement", label: "Complemento" },
  { key: "tasting_neighborhood", label: "Bairro" }, { key: "tasting_city", label: "Cidade" },
  { key: "tasting_state", label: "Estado (UF)" },
];

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => getAdminData(),
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [whatsapp, setWhatsapp] = useState("");
  const [pixQr, setPixQr] = useState("");
  const [saving, setSaving] = useState(false);
  const [newArea, setNewArea] = useState({ state_name: "", state_code: "" });
  const [newTastingDate, setNewTastingDate] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteView, setQuoteView] = useState<"all" | "active" | "archived">("active");
  const [quotePage, setQuotePage] = useState(1);
  const [tastingDateFilter, setTastingDateFilter] = useState("");
  const [tastingPaymentFilter, setTastingPaymentFilter] = useState("");
  const [tastingStatusFilter, setTastingStatusFilter] = useState("");
  const quotesQuery = useQuery({ queryKey: ["admin-quotes", quotePage, quoteSearch, quoteView], queryFn: () => getAdminQuotes({ data: { page: quotePage, search: quoteSearch, view: quoteView } }) });

  useEffect(() => {
    if (!data?.settings) return;
    const settings = data.settings as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const field of FIELDS) next[field.key] = String(settings[field.key] ?? "0");
    setValues(next);
    const nextTexts: Record<string, string> = {};
    for (const field of [...ORIGIN_FIELDS, ...PAYMENT_FIELDS, ...TASTING_ADDRESS_FIELDS])
      nextTexts[field.key] = String(settings[field.key] ?? "");
    setTexts(nextTexts);
    setWhatsapp(String(settings["whatsapp_number"] ?? ""));
    setPixQr(String(settings["pix_qr_url"] ?? ""));
  }, [data]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  /** Lê a imagem do QR Code como data URL para salvar junto das configurações. */
  function readQrFile(file: File) {
    if (file.size > 400_000) {
      toast.error("Escolha uma imagem de até 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPixQr(String(reader.result ?? ""));
    reader.onerror = () => toast.error("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        FIELDS.map((field) => [
          field.key,
          field.key === "minimum_guests"
            ? Math.round(Number(values[field.key] ?? 0))
            : Number(values[field.key] ?? 0),
        ]),
      ) as Record<string, number>;
      const textPayload = Object.fromEntries(
        [...ORIGIN_FIELDS, ...PAYMENT_FIELDS, ...TASTING_ADDRESS_FIELDS].map((field) => [field.key, texts[field.key] ?? ""]),
      );
      await updateSettings({
        data: {
          ...payload,
          tasting_interval_minutes: 60,
          ...textPayload,
          whatsapp_number: whatsapp,
          pix_qr_url: pixQr,
        } as never,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("Configurações atualizadas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAdmin(userId: string, admin: boolean) {
    try {
      await setUserAdmin({ data: { user_id: userId, admin } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      toast.success(admin ? "Acesso de administrador concedido." : "Acesso removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar o acesso.");
    }
  }

  async function setAreaActive(id: string, active: boolean) {
    try {
      await toggleServiceArea({ data: { id, active } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar o estado.");
    }
  }

  async function createArea() {
    try {
      await addServiceArea({
        data: { state_name: newArea.state_name, state_code: newArea.state_code },
      });
      setNewArea({ state_name: "", state_code: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      toast.success("Estado adicionado à área de atendimento.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar o estado.");
    }
  }

  const settingsRecord = (data?.settings ?? {}) as Record<string, unknown>;

  async function addTastingDate() {
    if (!newTastingDate) return;
    try {
      await upsertTastingDate({
        data: {
          id: null,
          date: newTastingDate,
          active: true,
          start_time: String(settingsRecord["tasting_start_time"] ?? "09:00"),
          end_time: String(settingsRecord["tasting_end_time"] ?? "18:00"),
          interval_minutes: 60,
          blocked_times: [],
        },
      });
      setNewTastingDate("");
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      toast.success("Data adicionada à agenda de degustação.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar a data.");
    }
  }

  async function patchTastingDate(
    day: {
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      interval_minutes: number;
      blocked_times: string[] | null;
      active: boolean;
    },
    patch: { active?: boolean; blocked_times?: string[]; start_time?: string; end_time?: string },
  ) {
    try {
      await upsertTastingDate({
        data: {
          id: day.id,
          date: day.date,
          active: patch.active ?? day.active,
          start_time: patch.start_time ?? day.start_time,
          end_time: patch.end_time ?? day.end_time,
          interval_minutes: 60,
          blocked_times: patch.blocked_times ?? day.blocked_times ?? [],
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar a data.");
    }
  }

  async function removeTastingDate(id: string) {
    try {
      await deleteTastingDate({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover a data.");
    }
  }

  async function patchAppointment(
    id: string,
    patch: { status?: "pending_payment" | "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"; payment_status?: "pending" | "paid" },
  ) {
    try {
      await updateAppointment({ data: { id, ...patch } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["tasting-agenda"] });
      toast.success("Degustação atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar a degustação.");
    }
  }

  async function patchQuoteStatus(id: string, status: string) {
    try {
      await updateQuoteStatus({ data: { id, status: status as never } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar o status.");
    }
  }

  async function setQuoteArchived(id: string, archived: boolean) {
    try { await archiveQuote({ data: { id, archived } }); await queryClient.invalidateQueries({ queryKey: ["admin-data"] }); await queryClient.invalidateQueries({ queryKey: ["admin-quotes"] }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao arquivar o orçamento."); }
  }

  const filteredQuotes = quotesQuery.data?.quotes ?? [];
  const filteredAppointments = (data?.appointments ?? []).filter((item) => (!tastingDateFilter || item.date === tastingDateFilter) && (!tastingPaymentFilter || item.payment_status === tastingPaymentFilter) && (!tastingStatusFilter || item.status === tastingStatusFilter));

  async function setDrinkActive(id: string, active: boolean) {
    try {
      await toggleDrink({ data: { id, active } });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar o drink.");
    }
  }

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Painel administrativo" />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold">Administração</h1>
          <Button variant="outline" className="rounded-xl" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-destructive">
            {error instanceof Error ? error.message : "Erro ao carregar os dados."}
          </p>
        ) : (
          <Tabs defaultValue="pricing" className="mt-8">
            <TabsList>
              <TabsTrigger value="pricing">Preços e frete</TabsTrigger>
              <TabsTrigger value="drinks">Cardápio</TabsTrigger>
              <TabsTrigger value="quotes">Orçamentos</TabsTrigger>
              <TabsTrigger value="tastings">Degustações</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="mt-6">
              <div className="surface-card grid gap-5 p-6 sm:grid-cols-2">
                {FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.suffix ? ` (${field.suffix})` : " (R$)"}
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      step="0.01"
                      min={0}
                      value={values[field.key] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp para envio (com DDI)</Label>
                  <Input
                    id="whatsapp"
                    maxLength={30}
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button className="h-12 rounded-xl" disabled={saving} onClick={() => void save()}>
                    {saving ? "Salvando…" : "Salvar configurações"}
                  </Button>
                </div>
              </div>

              <div className="surface-card mt-6 p-6">
                <h2 className="font-display text-xl font-bold">Degustação e pagamento (Pix)</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Esses dados aparecem no orçamento final, junto do aviso de enviar o comprovante
                  por WhatsApp.
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {PAYMENT_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        maxLength={field.maxLength}
                        value={texts[field.key] ?? ""}
                        onChange={(event) =>
                          setTexts((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="pix-qr">Imagem do QR Code Pix (até 400 KB)</Label>
                    <Input
                      id="pix-qr"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) readQrFile(file);
                      }}
                    />
                  </div>
                  {pixQr ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={pixQr}
                        alt="QR Code Pix cadastrado"
                        className="size-24 rounded-xl bg-white object-contain p-2"
                      />
                      <Button variant="ghost" className="rounded-xl" onClick={() => setPixQr("")}>
                        Remover imagem
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Salve com o botão “Salvar configurações” acima.
                </p>
              </div>

              <div className="surface-card mt-6 p-6">
                <h2 className="font-display text-xl font-bold">Endereço da degustação</h2>
                <p className="mt-1 text-xs text-muted-foreground">Este endereço é independente do ponto de saída usado no frete.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {TASTING_ADDRESS_FIELDS.map((field) => <div key={field.key} className="space-y-1.5"><Label htmlFor={field.key}>{field.label}</Label><Input id={field.key} value={texts[field.key] ?? ""} onChange={(event) => setTexts((current) => ({ ...current, [field.key]: field.key === "tasting_state" ? event.target.value.toUpperCase().slice(0, 2) : event.target.value }))} /></div>)}
                </div>
              </div>


              <div className="surface-card mt-6 p-6">
                <h2 className="font-display text-xl font-bold">
                  Ponto de saída da MAGIC BAR (origem das rotas)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Endereço usado para calcular a rota real e o frete de todos os orçamentos.
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {ORIGIN_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        maxLength={field.maxLength}
                        value={texts[field.key] ?? ""}
                        onChange={(event) =>
                          setTexts((current) => ({
                            ...current,
                            [field.key]:
                              field.key === "origin_state"
                                ? event.target.value.toUpperCase().slice(0, 2)
                                : event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Salve com o botão acima — as coordenadas da origem são atualizadas
                  automaticamente.
                </p>
              </div>

              <div className="surface-card mt-6 p-6">
                <h2 className="font-display text-xl font-bold">Área de Atendimento</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Orçamentos automáticos só são liberados para eventos nos estados ativos e dentro
                  da distância máxima configurada.
                </p>
                <div className="mt-5 divide-y divide-border">
                  {data?.serviceAreas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-display font-semibold">
                          {area.state_name} — {area.state_code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {area.active ? "Atendimento automático ativo" : "Inativo"}
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(area.active)}
                        onCheckedChange={(checked) => void setAreaActive(area.id, checked)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
                  <Input
                    placeholder="Nome do estado (ex.: Minas Gerais)"
                    value={newArea.state_name}
                    onChange={(event) =>
                      setNewArea((current) => ({ ...current, state_name: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={newArea.state_code}
                    onChange={(event) =>
                      setNewArea((current) => ({
                        ...current,
                        state_code: event.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={newArea.state_name.length < 2 || newArea.state_code.length !== 2}
                    onClick={() => void createArea()}
                  >
                    Adicionar estado
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="drinks" className="mt-6">
              <div className="surface-card divide-y divide-border p-2">
                {data?.drinks.map((drink) => (
                  <div key={drink.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="script-title text-xl">{drink.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(drink.ingredients ?? []).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <CategoryBadge category={drink.category as DrinkCategory} />
                      <Switch
                        checked={Boolean(drink.active)}
                        onCheckedChange={(checked) => void setDrinkActive(drink.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quotes" className="mt-6">
              <div className="mb-5 flex flex-wrap gap-3"><Input className="max-w-sm" placeholder="Buscar por nome, CPF ou data" value={quoteSearch} onChange={(event) => { setQuoteSearch(event.target.value); setQuotePage(1); }} /><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={quoteView} onChange={(event) => { setQuoteView(event.target.value as typeof quoteView); setQuotePage(1); }}><option value="all">Todos</option><option value="active">Ativos</option><option value="archived">Arquivados</option></select></div>
              {filteredQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum orçamento gerado ainda.</p>
              ) : (
                <div className="space-y-3">
                   {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="surface-card p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-display text-lg font-bold">{quote.client_name}</p>
                        <p className="text-brand-red font-display text-lg font-bold">
                          {formatBRL(Number(quote.total))}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(quote.created_at).toLocaleString("pt-BR")} · {quote.event_type} ·{" "}
                        {quote.city} · {quote.adults} adultos / {quote.children} crianças ·{" "}
                        {formatBRL(Number(quote.price_per_person))} por pessoa
                      </p>
                      <p className="mt-2 text-xs">{(quote.drink_names ?? []).join(" · ")}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <select
                          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                          value={String(quote.status ?? "sent")}
                          onChange={(event) =>
                            void patchQuoteStatus(quote.id, event.target.value)
                          }
                        >
                          {Object.entries(QUOTE_STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {quote.public_token ? (
                          <a
                            href={`/orcamento/${quote.public_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline"
                          >
                            Abrir link público
                          </a>
                        ) : null}
                        <Button variant="ghost" className="rounded-xl text-xs" onClick={() => void setQuoteArchived(quote.id, !quote.archived_at)}>{quote.archived_at ? "Restaurar" : "Arquivar"}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 flex items-center justify-between"><Button variant="outline" disabled={quotePage === 1} onClick={() => setQuotePage((page) => page - 1)}>Anterior</Button><span className="text-xs text-muted-foreground">Página {quotePage} de {Math.max(1, Math.ceil((quotesQuery.data?.count ?? 0) / (quotesQuery.data?.pageSize ?? 20)))}</span><Button variant="outline" disabled={quotePage * (quotesQuery.data?.pageSize ?? 20) >= (quotesQuery.data?.count ?? 0)} onClick={() => setQuotePage((page) => page + 1)}>Próxima</Button></div>
            </TabsContent>

            <TabsContent value="tastings" className="mt-6">
              <div className="surface-card mb-6 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">Link da agenda</h2><p className="text-sm text-muted-foreground">{typeof window !== "undefined" ? `${window.location.origin}/degustacao` : "/degustacao"}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/degustacao`).then(() => toast.success("Link copiado."))}>Copiar link</Button><Button onClick={() => void (navigator.share ? navigator.share({ title: "Agenda MAGIC BAR", url: `${window.location.origin}/degustacao` }) : navigator.clipboard.writeText(`${window.location.origin}/degustacao`))}>Compartilhar agenda</Button></div></div></div>
              <div className="surface-card p-6">
                <h2 className="font-display text-xl font-bold">Agenda de degustação</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Adicione, ative, bloqueie horários ou remova datas. O cliente só vê datas ativas.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Input
                    type="date"
                    className="w-48"
                    value={newTastingDate}
                    onChange={(event) => setNewTastingDate(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={!newTastingDate}
                    onClick={() => void addTastingDate()}
                  >
                    Adicionar data
                  </Button>
                </div>

                <div className="mt-6 space-y-5 divide-y divide-border">
                  {(data?.tastingDates ?? []).map((day) => {
                    const blocked = (day.blocked_times ?? []) as string[];
                    const slots = buildSlots(
                      String(day.start_time),
                      String(day.end_time),
                      Number(day.interval_minutes),
                    );
                    return (
                      <div key={day.id} className="pt-5 first:pt-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-display font-semibold">
                            {new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                            {day.start_time}–{day.end_time} · {day.interval_minutes} min
                          </p>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={Boolean(day.active)}
                              onCheckedChange={(checked) =>
                                void patchTastingDate(day as never, { active: checked })
                              }
                            />
                            <Button
                              variant="ghost"
                              className="rounded-xl text-xs"
                              onClick={() => void removeTastingDate(day.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2"><Input type="time" className="w-32" defaultValue={day.start_time} onBlur={(event) => void patchTastingDate(day as never, { start_time: event.target.value })} /><Input type="time" className="w-32" defaultValue={day.end_time} onBlur={(event) => void patchTastingDate(day as never, { end_time: event.target.value })} /></div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {slots.map((slot) => {
                            const isBlocked = blocked.includes(slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                className={`h-9 rounded-xl border px-3 text-xs ${
                                  isBlocked
                                    ? "border-destructive text-destructive line-through"
                                    : "border-border"
                                }`}
                                onClick={() =>
                                  void patchTastingDate(day as never, {
                                    blocked_times: isBlocked
                                      ? blocked.filter((item) => item !== slot)
                                      : [...blocked, slot],
                                  })
                                }
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {(data?.tastingDates ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma data cadastrada.</p>
                  ) : null}
                </div>
              </div>

              <div className="surface-card mt-6 p-6">
                <h2 className="font-display text-xl font-bold">Degustações agendadas</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="font-display text-2xl font-bold">{(data?.appointments ?? []).filter((item) => item.payment_status === "pending" && item.status !== "cancelled").length}</p></div><div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Pagas</p><p className="font-display text-2xl font-bold">{(data?.appointments ?? []).filter((item) => item.payment_status === "paid").length}</p></div><div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Confirmadas</p><p className="font-display text-2xl font-bold">{(data?.appointments ?? []).filter((item) => item.status === "confirmed").length}</p></div></div>
                <div className="mt-4 flex flex-wrap gap-3"><Input type="date" className="w-44" value={tastingDateFilter} onChange={(event) => setTastingDateFilter(event.target.value)} /><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={tastingPaymentFilter} onChange={(event) => setTastingPaymentFilter(event.target.value)}><option value="">Todos os pagamentos</option><option value="pending">Pendente</option><option value="paid">Pago</option></select><select className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={tastingStatusFilter} onChange={(event) => setTastingStatusFilter(event.target.value)}><option value="">Todos os status</option><option value="pending_payment">Pendente pagamento</option><option value="scheduled">Agendado</option><option value="confirmed">Confirmado</option><option value="completed">Realizado</option><option value="cancelled">Cancelado</option><option value="no_show">Não compareceu</option></select></div>
                <div className="mt-5 divide-y divide-border">
                  {filteredAppointments.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-display font-semibold">
                          {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                          {item.time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                           {item.client_name || "Sem nome"} · {item.client_phone || "Sem WhatsApp"} · {item.people} pessoa(s) ·{" "}
                          {formatBRL(Number(item.total))} ·{" "}
                          {item.payment_status === "paid" ? "Pago" : "Pagamento pendente"} ·{" "}
                          {item.status === "confirmed"
                            ? "Confirmada"
                            : item.status === "cancelled"
                              ? "Cancelada"
                              : "Agendada"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl text-xs"
                          onClick={() =>
                            void patchAppointment(item.id, {
                              payment_status: "paid",
                              status: "confirmed",
                            })
                          }
                        >
                          Confirmar pagamento
                        </Button>
                        <select className="h-10 rounded-xl border border-border bg-background px-2 text-xs" value={item.payment_status} onChange={(event) => void patchAppointment(item.id, { payment_status: event.target.value as "pending" | "paid" })}><option value="pending">Pagamento pendente</option><option value="paid">Pago</option></select>
                        <select className="h-10 rounded-xl border border-border bg-background px-2 text-xs" value={item.status} onChange={(event) => void patchAppointment(item.id, { status: event.target.value as never })}><option value="pending_payment">Pendente pagamento</option><option value="scheduled">Agendado</option><option value="confirmed">Confirmado</option><option value="completed">Realizado</option><option value="cancelled">Cancelado</option><option value="no_show">Não compareceu</option></select>
                        <Button
                          variant="ghost"
                          className="rounded-xl text-xs"
                           onClick={() => { if (window.confirm("Tem certeza que deseja cancelar esta degustação?")) void patchAppointment(item.id, { status: "cancelled" }); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(data?.appointments ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma degustação agendada.</p>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <p className="text-xs text-muted-foreground">
                Todas as pessoas que já entraram no app. Ative a chave para transformar alguém em
                administrador.
              </p>
              <div className="surface-card mt-4 divide-y divide-border p-2">
                {data?.users.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
                ) : (
                  data?.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-display truncate font-semibold">
                          {user.full_name || user.email || "Sem nome"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email} ·{" "}
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString("pt-BR")
                            : ""}
                          {user.id === data.currentUserId ? " · você" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {user.is_admin ? "Administrador" : "Cliente"}
                        </span>
                        <Switch
                          checked={user.is_admin}
                          disabled={user.id === data.currentUserId}
                          onCheckedChange={(checked) => void toggleAdmin(user.id, checked)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}