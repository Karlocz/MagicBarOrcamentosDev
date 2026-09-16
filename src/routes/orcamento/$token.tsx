import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BrandHeader } from "@/components/BrandHeader";
import { getPublicQuote } from "@/lib/catalog.functions";
import { formatBRL } from "@/lib/pricing";
import { EVENT_TYPE_LABEL, honoreeSummaryFromRecord, QUOTE_STATUS_LABEL } from "@/lib/quote-state";

const quoteQuery = (token: string) =>
  queryOptions({
    queryKey: ["public-quote", token],
    queryFn: () => getPublicQuote({ data: { token } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/orcamento/$token")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(quoteQuery(params.token)),
  head: () => ({
    meta: [
      { title: "Orçamento MAGIC BAR Eventos" },
      {
        name: "description",
        content:
          "Consulte o orçamento de open bar da MAGIC BAR: drinks escolhidos, convidados, frete, total do evento e degustação agendada.",
      },
      { property: "og:title", content: "Orçamento MAGIC BAR Eventos" },
      {
        property: "og:description",
        content: "Drinks, convidados, frete e total do seu evento com a MAGIC BAR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicQuotePage,
  errorComponent: () => (
    <Centered>Não foi possível carregar este orçamento. Tente novamente em instantes.</Centered>
  ),
  notFoundComponent: () => <Centered>Orçamento não encontrado.</Centered>,
});

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-brand-red text-[0.62rem] tracking-[0.32em] uppercase">{title}</h2>
      {children}
    </div>
  );
}

function PublicQuotePage() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(quoteQuery(token));

  if (!data) return <Centered>Orçamento não encontrado.</Centered>;

  const { quote, tasting, tastingAddress } = data;
  const brDate = (value: string | null) =>
    value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "";
  const address = [
    quote.address,
    quote.address_number,
    quote.address_complement,
    quote.city && quote.state ? `${quote.city} - ${quote.state}` : quote.city,
    quote.cep,
  ]
    .filter(Boolean)
    .join(", ");
  const eventTypeLabel =
    EVENT_TYPE_LABEL[quote.event_type as keyof typeof EVENT_TYPE_LABEL] ?? quote.event_type;
  const tastingLocation = tastingAddress
    ? [tastingAddress.tasting_address, tastingAddress.tasting_number, tastingAddress.tasting_complement, tastingAddress.tasting_neighborhood, tastingAddress.tasting_city && tastingAddress.tasting_state ? `${tastingAddress.tasting_city} - ${tastingAddress.tasting_state}` : tastingAddress.tasting_city, tastingAddress.tasting_cep].filter(Boolean).join(", ")
    : "";

  return (
    <div className="min-h-screen pb-16">
      <BrandHeader subtitle="Orçamento do cliente" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Orçamento MAGIC BAR</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {QUOTE_STATUS_LABEL[quote.status] ?? quote.status}
        </p>

        <div className="surface-card mt-8 space-y-8 p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <Section title="Contratante">
              <Row label="Nome" value={quote.client_name} />
              <Row label="CPF" value={quote.client_cpf_masked} />
            </Section>
            <Section title="Evento">
              <Row label="Tipo" value={eventTypeLabel} />
              <Row
                label="Homenageado(s)"
                value={honoreeSummaryFromRecord(
                  quote.honoree_names as Record<string, unknown> | null,
                )}
              />
            </Section>
            <Section title="Data e horários">
              <Row label="Data" value={brDate(quote.event_date)} />
              <Row label="Buffet" value={quote.buffet_time ?? ""} />
              <Row label="Bar" value={quote.bar_time ?? ""} />
              <Row label="DJ" value={quote.dj_time ?? ""} />
            </Section>
            <Section title="Local">
              <Row label="Endereço" value={address} />
              <Row
                label="Distância"
                value={
                  quote.distance_km != null
                    ? `${Number(quote.distance_km).toFixed(1).replace(".", ",")} km`
                    : ""
                }
              />
            </Section>
            <Section title="Convidados">
              <Row label="Adultos" value={String(quote.adults)} />
              <Row label="Crianças" value={String(quote.children)} />
            </Section>
            <Section title="Drinks">
              <ul className="space-y-1 text-sm">
                {(quote.drink_names ?? []).map((name: string) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="border-t border-border pt-6">
            <Section title="Valores">
              <Row label="Preço por pessoa" value={formatBRL(Number(quote.price_per_person ?? 0))} />
              <Row label="Taça/copo por pessoa" value={formatBRL(Number(quote.glass_rental ?? 0))} />
              <Row label="Adultos" value={formatBRL(Number(quote.adults_total ?? 0))} />
              <Row label="Crianças" value={formatBRL(Number(quote.children_total ?? 0))} />
              <Row label="Frete" value={formatBRL(Number(quote.freight ?? 0))} />
            </Section>
            <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-secondary px-5 py-4">
              <span className="text-xs tracking-[0.32em] uppercase">Total</span>
              <span className="font-display text-brand-red text-2xl font-bold tabular-nums">
                {formatBRL(Number(quote.total ?? 0))}
              </span>
            </div>
          </div>

          {tasting ? (
            <div className="border-t border-border pt-6">
              <Section title="Degustação">
                <Row label="Data" value={brDate(tasting.date)} />
                <Row label="Horário" value={tasting.time} />
                <Row label="Duração" value={`${tasting.duration_minutes} minutos`} />
                <Row label="Participantes" value={String(tasting.people)} />
                <Row
                  label="Valor por pessoa"
                  value={formatBRL(Number(tasting.price_per_person ?? 0))}
                />
                <Row label="Total da degustação" value={formatBRL(Number(tasting.total ?? 0))} />
                <Row label="Pagamento" value={tasting.payment_status === "paid" ? "Pago" : "Pendente"} />
                <Row label="Status" value={tasting.status === "confirmed" ? "Confirmada" : tasting.status === "completed" ? "Realizada" : tasting.status === "cancelled" ? "Cancelada" : tasting.status === "no_show" ? "Não compareceu" : tasting.status === "scheduled" ? "Agendada" : "Pendente pagamento"} />
                {tasting.status === "confirmed" && tastingLocation ? <Row label="Endereço" value={tastingLocation} /> : null}
              </Section>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
