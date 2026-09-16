import { CalendarPlus, FileDown, MapPinned, MessageCircle, Pencil, Share2 } from "lucide-react";

import dragonMark from "@/assets/dragon-mark.png";
import { Button } from "@/components/ui/button";
import { TastingBooking } from "@/components/tasting/TastingBooking";
import { CATEGORY_META, formatBRL, type QuoteMath } from "@/lib/pricing";
import {
  EVENT_TYPE_LABEL,
  honoreeSummary,
  type Drink,
  type QuoteForm,
} from "@/lib/quote-state";

/** Google Calendar template link for the event day (bar opening time when informed). */
function googleCalendarHref(form: QuoteForm, title: string): string | null {
  if (!form.eventDate) return null;
  const time = (form.barTime || form.buffetTime || "18:00").padStart(5, "0");
  const start = new Date(`${form.eventDate}T${time}:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details:
      "Evento com open bar MAGIC BAR. Fechamento de orçamento e degustação a combinar pelo WhatsApp.",
    location: [form.address, form.addressNumber, form.city, form.state].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function Block({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="text-brand-red text-[0.62rem] tracking-[0.32em] uppercase">{title}</h3>
      <dl className="mt-2 space-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export type TastingAgenda = {
  dates: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    interval_minutes: number;
    blocked_times: string[];
  }>;
  booked: Array<{ date: string; time: string }>;
};

export function FinalQuote({
  form,
  math,
  drinks,
  distanceKm,
  whatsappNumber,
  quoteId,
  publicToken,
  originAddress,
  onEdit,
}: {
  form: QuoteForm;
  math: QuoteMath;
  drinks: Drink[];
  distanceKm: number | null;
  whatsappNumber: string;
  quoteId: string | null;
  publicToken: string | null;
  originAddress: string;
  onEdit: () => void;
}) {
  const dateLabel = form.eventDate
    ? new Date(`${form.eventDate}T12:00:00`).toLocaleDateString("pt-BR")
    : "";
  const fullAddress = [
    form.address,
    form.addressNumber,
    form.addressComplement,
    form.city && form.state ? `${form.city} - ${form.state}` : form.city,
    form.cep,
  ]
    .filter(Boolean)
    .join(", ");

  const publicUrl =
    publicToken && typeof window !== "undefined"
      ? `${window.location.origin}/orcamento/${publicToken}`
      : "";
  const brDate = (value: string) =>
    value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "";

  const eventBlock =
    form.eventType === "noivos"
      ? [`*Noivos:* ${honoreeSummary(form)}`]
      : form.eventType === "debutante"
        ? [`*Debutante:* ${form.debutanteName}`]
        : form.eventType === "aniversariante"
          ? [`*Aniversariante:* ${form.birthdayName}`]
          : [];

  const message = [
    "*MAGIC BAR — NOVO ORÇAMENTO*",
    "",
    "*CONTRATANTE*",
    `Nome: ${form.clientName}`,
    `CPF: ${form.clientCpf}`,
    "",
    "*EVENTO*",
    `Tipo: ${form.eventType ? EVENT_TYPE_LABEL[form.eventType] : ""}`,
    ...eventBlock,
    "",
    "*DATA E HORÁRIOS*",
    `Data do evento: ${dateLabel}`,
    `Buffet: ${form.buffetTime || "—"}`,
    `Bar: ${form.barTime || "—"}`,
    `DJ: ${form.djTime || "—"}`,
    "",
    "*LOCAL*",
    `Endereço: ${fullAddress}`,
    `Cidade: ${form.city}`,
    `Estado: ${form.state}`,
    `Distância: ${distanceKm != null ? `${distanceKm.toFixed(1).replace(".", ",")} km` : "—"}`,
    `Frete: ${formatBRL(math.freight)}`,
    "",
    "*CONVIDADOS*",
    `Adultos: ${form.adults}`,
    `Crianças: ${form.children}`,
    "",
    "*DRINKS ESCOLHIDOS*",
    ...drinks.map((drink) => `• ${drink.name}`),
    "",
    "*VALORES*",
    `Preço por pessoa: ${formatBRL(math.pricePerPerson)}`,
    `Taça/copo: ${formatBRL(math.glassRental)}`,
    `Adultos: ${formatBRL(math.adultsTotal)}`,
    `Crianças: ${formatBRL(math.childrenTotal)}`,
    `Frete: ${formatBRL(math.freight)}`,
    `*TOTAL DO EVENTO: ${formatBRL(math.total)}*`,
    ...(form.tastingDate && form.tastingTime
      ? [
          "",
          "*DEGUSTAÇÃO*",
          `Data: ${brDate(form.tastingDate)}`,
          `Horário: ${form.tastingTime}`,
          `Participantes: ${form.tastingPeople}`,
          "Duração: 1 hora",
        ]
      : []),
    ...(publicUrl ? ["", `Orçamento completo: ${publicUrl}`] : []),
  ].join("\n");

  const waHref = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  const eventTitle = `MAGIC BAR — ${form.eventType ? EVENT_TYPE_LABEL[form.eventType] : "Evento"}${
    honoreeSummary(form) ? ` · ${honoreeSummary(form)}` : ""
  }`;
  const calendarHref = googleCalendarHref(form, eventTitle);
  const mapsHref = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(fullAddress)}`;

  async function shareQuote() {
    if (!publicUrl) return;
    if (navigator.share) await navigator.share({ title: "Orçamento MAGIC BAR", text: "Orçamento MAGIC BAR", url: publicUrl });
    else {
      await navigator.clipboard.writeText(publicUrl);
      alert("Link do orçamento copiado.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button className="h-12 rounded-xl" onClick={() => window.print()}>
          <FileDown className="mr-2 size-4" /> Gerar PDF
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl">
          <a href={waHref} target="_blank" rel="noreferrer">
            <MessageCircle className="mr-2 size-4" /> Enviar WhatsApp
          </a>
        </Button>
        {publicUrl ? <Button variant="outline" className="h-12 rounded-xl" onClick={() => void shareQuote()}><Share2 className="mr-2 size-4" /> Compartilhar orçamento</Button> : null}
        <Button asChild variant="outline" className="h-12 rounded-xl"><a href={mapsHref} target="_blank" rel="noreferrer"><MapPinned className="mr-2 size-4" /> Ver trajeto no Google Maps</a></Button>
        <Button variant="ghost" className="h-12 rounded-xl" onClick={onEdit}>
          <Pencil className="mr-2 size-4" /> Editar
        </Button>
      </div>

      <article
        id="quote-document"
        className="surface-card space-y-8 p-6 sm:p-10 print:border-0 print:shadow-none"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <img
              src={dragonMark}
              alt="MAGIC BAR"
              width={816}
              height={816}
              loading="lazy"
              className="h-14 w-14 object-contain"
            />
            <div>
              <p className="text-[0.6rem] tracking-[0.4em] text-muted-foreground uppercase">
                Open Bar
              </p>
              <p className="font-display text-2xl font-bold">MAGIC BAR</p>
              <p className="text-[0.6rem] tracking-[0.4em] text-muted-foreground uppercase">
                Eventos
              </p>
            </div>
          </div>
          <p className="font-display text-right text-xl font-bold tracking-[0.2em] uppercase">
            Orçamento
          </p>
        </header>

        <div className="grid gap-8 sm:grid-cols-2">
          <Block
            title="Contratante"
            rows={[
              ["Nome", form.clientName],
              ["CPF", form.clientCpf],
            ]}
          />
          <Block
            title="Evento"
            rows={[
              ["Tipo", form.eventType ? EVENT_TYPE_LABEL[form.eventType] : ""],
              ["Homenageado(s)", honoreeSummary(form)],
            ]}
          />
          <Block
            title="Local"
            rows={[
              ["Endereço", fullAddress],
              [
                "Distância",
                distanceKm != null ? `${distanceKm.toFixed(1).replace(".", ",")} km` : "",
              ],
              ["Frete", formatBRL(math.freight)],
            ]}
          />
          <Block
            title="Data e horários"
            rows={[
              ["Data", dateLabel],
              ["Abertura buffet", form.buffetTime],
              ["Abertura bar", form.barTime],
              ["Abertura DJ", form.djTime],
            ]}
          />
          <Block
            title="Convidados"
            rows={[
              ["Adultos", String(form.adults)],
              ["Crianças (0 a 5 anos)", String(form.children)],
            ]}
          />
          <div>
            <h3 className="text-brand-red text-[0.62rem] tracking-[0.32em] uppercase">Drinks</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {drinks.map((drink) => (
                <li key={drink.id} className="flex justify-between gap-3">
                  <span>{drink.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_META[drink.category].label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-brand-red text-[0.62rem] tracking-[0.32em] uppercase">Valores</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt>Pacote por pessoa</dt>
              <dd className="tabular-nums">{formatBRL(math.pricePerPerson)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Aluguel de taça/copo por pessoa</dt>
              <dd className="tabular-nums">{formatBRL(math.glassRental)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                Adultos — {form.adults} × {formatBRL(math.adultUnit)}
              </dt>
              <dd className="tabular-nums">{formatBRL(math.adultsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                Crianças — {form.children} × {formatBRL(math.childUnit)}
              </dt>
              <dd className="tabular-nums">{formatBRL(math.childrenTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Frete</dt>
              <dd className="tabular-nums">{formatBRL(math.freight)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-secondary px-5 py-4">
            <span className="text-xs tracking-[0.32em] uppercase">Total</span>
            <span className="font-display text-brand-red text-3xl font-bold tabular-nums">
              {formatBRL(math.total)}
            </span>
          </div>
        </div>

        <div className="border-t border-border bg-foreground px-5 py-7 text-background print:hidden">
          <TastingBooking quoteId={quoteId} quoteUrl={publicUrl} initialName={form.clientName} />
          {calendarHref ? <Button asChild variant="outline" className="mt-5 h-12 rounded-xl"><a href={calendarHref} target="_blank" rel="noreferrer"><CalendarPlus className="mr-2 size-4" /> Adicionar evento ao Google Calendar</a></Button> : null}
        </div>

        <footer className="border-t border-border pt-4 text-[0.65rem] text-muted-foreground">
          Orçamento válido por 7 dias · MAGIC BAR Eventos · @Magicbareeventos
        </footer>
      </article>
    </div>
  );
}