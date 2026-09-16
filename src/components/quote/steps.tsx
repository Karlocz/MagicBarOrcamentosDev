import { Baby, Cake, Clock, Crown, Heart, Loader2, MapPin, Route } from "lucide-react";
import { useState } from "react";

import { Counter, Field, StepShell, TextField } from "@/components/quote/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidCPF, maskCEP, maskCPF } from "@/lib/pricing";
import type { EventType, FreightResult, QuoteForm } from "@/lib/quote-state";
import { cn } from "@/lib/utils";

type Update = <K extends keyof QuoteForm>(key: K, value: QuoteForm[K]) => void;

export function ClientStep({
  form,
  update,
  showErrors,
}: {
  form: QuoteForm;
  update: Update;
  showErrors: boolean;
}) {
  const cpfError =
    showErrors && !isValidCPF(form.clientCpf) ? "Informe um CPF válido." : undefined;
  return (
    <StepShell
      eyebrow="Etapa 1"
      title="Dados do contratante"
      description="Nome e CPF da pessoa que constará no contrato."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Nome completo"
          value={form.clientName}
          onChange={(value) => update("clientName", value)}
          placeholder="Ex.: Maria Souza Lima"
          maxLength={120}
          error={
            showErrors && form.clientName.trim().length < 3 ? "Informe o nome completo." : undefined
          }
        />
        <TextField
          label="CPF"
          value={form.clientCpf}
          onChange={(value) => update("clientCpf", maskCPF(value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          error={cpfError}
        />
      </div>
    </StepShell>
  );
}

const EVENT_OPTIONS: Array<{ type: EventType; label: string; icon: typeof Heart }> = [
  { type: "noivos", label: "Noivos", icon: Heart },
  { type: "debutante", label: "Debutante", icon: Crown },
  { type: "aniversariante", label: "Aniversariante", icon: Cake },
];

export function EventStep({
  form,
  update,
  showErrors,
}: {
  form: QuoteForm;
  update: Update;
  showErrors: boolean;
}) {
  return (
    <StepShell
      eyebrow="Etapa 2"
      title="Tipo de evento"
      description="Selecione uma opção para personalizar o orçamento."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {EVENT_OPTIONS.map(({ type, label, icon: Icon }) => {
          const active = form.eventType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => update("eventType", type)}
              className={cn(
                "surface-card flex flex-col items-center gap-3 p-7 transition-all duration-300",
                active
                  ? "border-brand-red shadow-lift -translate-y-0.5 border-2"
                  : "hover:shadow-lift hover:-translate-y-0.5",
              )}
            >
              <Icon className={cn("size-7", active ? "text-brand-red" : "text-muted-foreground")} />
              <span className="font-display text-lg font-semibold">{label}</span>
            </button>
          );
        })}
      </div>

      {form.eventType === "noivos" ? (
        <div className="mt-8">
          <p className="text-[0.62rem] tracking-[0.32em] text-muted-foreground uppercase">
            Nomes dos noivos
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <TextField
              label="Nome 1"
              value={form.partner1Name}
              onChange={(value) => update("partner1Name", value)}
            />
            <TextField
              label="Nome 2"
              value={form.partner2Name}
              onChange={(value) => update("partner2Name", value)}
            />
          </div>
        </div>
      ) : null}
      {form.eventType === "debutante" ? (
        <div className="mt-8 sm:max-w-md">
          <TextField
            label="Nome da debutante"
            value={form.debutanteName}
            onChange={(value) => update("debutanteName", value)}
          />
        </div>
      ) : null}
      {form.eventType === "aniversariante" ? (
        <div className="mt-8 sm:max-w-md">
          <TextField
            label="Nome do aniversariante"
            value={form.birthdayName}
            onChange={(value) => update("birthdayName", value)}
          />
        </div>
      ) : null}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Data do evento">
          <Input
            type="date"
            value={form.eventDate}
            onChange={(event) => update("eventDate", event.target.value)}
            className="h-12 rounded-xl bg-card text-base"
          />
        </Field>
        <Field label="Abertura do buffet">
          <Input
            type="time"
            value={form.buffetTime}
            onChange={(event) => update("buffetTime", event.target.value)}
            className="h-12 rounded-xl bg-card text-base"
          />
        </Field>
        <Field label="Abertura do bar">
          <Input
            type="time"
            value={form.barTime}
            onChange={(event) => update("barTime", event.target.value)}
            className="h-12 rounded-xl bg-card text-base"
          />
        </Field>
        <Field label="Abertura do DJ">
          <Input
            type="time"
            value={form.djTime}
            onChange={(event) => update("djTime", event.target.value)}
            className="h-12 rounded-xl bg-card text-base"
          />
        </Field>
      </div>
      {showErrors && !form.eventType ? (
        <p className="text-brand-red mt-4 text-xs">Selecione o tipo de evento.</p>
      ) : null}
    </StepShell>
  );
}

function formatDuration(minutes: number): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}min` : `${rest} min`;
}

function osmEmbedSrc(origin: [number, number], destination: [number, number]): string {
  const pad = 0.05;
  const minLat = Math.min(origin[0], destination[0]) - pad;
  const maxLat = Math.max(origin[0], destination[0]) + pad;
  const minLng = Math.min(origin[1], destination[1]) - pad;
  const maxLng = Math.max(origin[1], destination[1]) + pad;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${destination[0]},${destination[1]}`;
}

export function VenueStep({
  form,
  update,
  freight,
  onEstimate,
  onReset,
  showErrors,
  formatCurrency,
  whatsappNumber,
}: {
  form: QuoteForm;
  update: Update;
  freight: FreightResult;
  onEstimate: () => void;
  onReset: () => void;
  showErrors: boolean;
  formatCurrency: (value: number) => string;
  whatsappNumber: string;
}) {
  const [cepLoading, setCepLoading] = useState(false);

  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as {
        logradouro?: string;
        localidade?: string;
        uf?: string;
        erro?: boolean;
      };
      if (!data.erro) {
        update("address", data.logradouro ?? "");
        update("city", data.localidade ?? "");
        update("state", data.uf ?? "");
      }
    } catch {
      /* endereço pode ser preenchido manualmente */
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <StepShell
      eyebrow="Etapa 3"
      title="Local do evento"
      description="Calculamos a distância e o frete a partir da base da MAGIC BAR."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="CEP" hint={cepLoading ? "Buscando endereço..." : undefined}>
          <Input
            value={form.cep}
            inputMode="numeric"
            placeholder="00000-000"
            onChange={(event) => {
              const masked = maskCEP(event.target.value);
              update("cep", masked);
              void lookupCep(masked);
            }}
            className="h-12 rounded-xl bg-card text-base"
          />
        </Field>
        <TextField
          label="Endereço"
          value={form.address}
          onChange={(value) => update("address", value)}
          error={showErrors && form.address.trim().length < 3 ? "Informe o endereço." : undefined}
        />
        <TextField
          label="Número"
          value={form.addressNumber}
          onChange={(value) => update("addressNumber", value)}
        />
        <TextField
          label="Complemento"
          value={form.addressComplement}
          onChange={(value) => update("addressComplement", value)}
        />
        <TextField
          label="Cidade"
          value={form.city}
          onChange={(value) => update("city", value)}
          error={showErrors && form.city.trim().length < 2 ? "Informe a cidade." : undefined}
        />
        <TextField
          label="Estado"
          value={form.state}
          onChange={(value) => update("state", value.toUpperCase().slice(0, 2))}
          placeholder="SP"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-6 h-12 rounded-xl"
        onClick={onEstimate}
        disabled={freight.status === "loading"}
      >
        {freight.status === "loading" ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <MapPin className="mr-2 size-4" />
        )}
        Calcular distância e frete
      </Button>

      {freight.status === "ok" ? (
        <div className="surface-card mt-6 overflow-hidden">
          <div className="border-b border-border p-6">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Rota da MAGIC BAR até o evento
            </p>
          </div>
          <iframe
            title="Rota até o local do evento"
            className="h-64 w-full border-0"
            loading="lazy"
            src={osmEmbedSrc(freight.origin, freight.destination)}
          />
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <MapPin className="text-brand-red mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold">Origem:</span> {freight.originAddress}
                </span>
              </div>
              <div className="flex gap-2">
                <Route className="text-brand-red mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold">Distância real:</span>{" "}
                  {freight.distanceKm.toFixed(1).replace(".", ",")} km
                </span>
              </div>
              <div className="flex gap-2">
                <Clock className="text-brand-red mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold">Tempo estimado:</span>{" "}
                  {formatDuration(freight.durationMinutes)}
                </span>
              </div>
              <div className="flex gap-2">
                <MapPin className="text-brand-red mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold">Destino:</span> {freight.destinationLabel}
                </span>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Frete calculado
              </p>
              <p className="font-display text-brand-red text-3xl font-bold">
                {formatCurrency(freight.freight)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {freight.status === "out_of_state" ? (
        <div className="border-brand-red/40 bg-brand-red/5 mt-6 rounded-2xl border p-6">
          <p className="font-display text-brand-red text-xl font-bold">
            Local fora da área de atendimento
          </p>
          <p className="mt-2 text-sm">{freight.message}</p>
          <p className="mt-3 text-sm">
            📍 Local informado: {freight.city} — {freight.state}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Entre em contato com a MAGIC BAR para consultar condições especiais.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onReset}>
              Alterar endereço
            </Button>
            {whatsappNumber ? (
              <Button asChild type="button" className="rounded-xl">
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar com a MAGIC BAR
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {freight.status === "out_of_range" ? (
        <div className="border-brand-red/40 bg-brand-red/5 mt-6 rounded-2xl border p-6">
          <p className="font-display text-brand-red text-xl font-bold">
            Local fora da distância padrão de atendimento
          </p>
          <p className="mt-2 text-sm">
            O evento está localizado dentro do Estado de São Paulo, porém a distância estimada é
            superior ao limite configurado para atendimento automático.
          </p>
          <p className="mt-3 text-sm">
            📍 Distância calculada: {freight.distanceKm.toFixed(1).replace(".", ",")} km
          </p>
          <p className="text-sm">📏 Limite atual: {freight.maxKm} km</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Entre em contato com a MAGIC BAR para consultar disponibilidade.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onReset}>
              Alterar endereço
            </Button>
            {whatsappNumber ? (
              <Button asChild type="button" className="rounded-xl">
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar com a MAGIC BAR
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {freight.status === "error" ? (
        <div className="border-brand-red/40 bg-brand-red/5 mt-6 rounded-2xl border p-5">
          <p className="text-brand-red text-sm font-semibold">{freight.message}</p>
        </div>
      ) : null}

      {showErrors && freight.status !== "ok" ? (
        <p className="text-brand-red mt-4 text-xs">
          Calcule o frete e confirme a área de atendimento para seguir com o orçamento.
        </p>
      ) : null}
    </StepShell>
  );
}

export function GuestsStep({
  form,
  update,
  adultUnit,
  childUnit,
  minimumGuests,
  tastingPrice,
  formatCurrency,
}: {
  form: QuoteForm;
  update: Update;
  adultUnit: number;
  childUnit: number;
  minimumGuests: number;
  tastingPrice: number;
  formatCurrency: (value: number) => string;
}) {
  const total = form.adults + form.children;
  const belowMinimum = total < minimumGuests;
  return (
    <StepShell
      eyebrow="Etapa 4"
      title="Convidados"
      description={`Orçamento mínimo para ${minimumGuests} pessoas. Crianças de 0 a 5 anos entram com valor reduzido.`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Counter
          label="Adultos"
          hint={adultUnit > 0 ? `${formatCurrency(adultUnit)} por adulto` : "Escolha os drinks"}
          value={form.adults}
          min={minimumGuests}
          onChange={(value) => update("adults", value)}
        />
        <Counter
          label="Crianças"
          hint={childUnit > 0 ? `${formatCurrency(childUnit)} por criança` : "0 a 5 anos"}
          value={form.children}
          onChange={(value) => update("children", value)}
        />
      </div>
      {belowMinimum ? (
        <p className="text-brand-red mt-5 text-sm font-medium">
          Atendemos eventos a partir de {minimumGuests} pessoas — hoje você somou {total}.
        </p>
      ) : null}
      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Baby className="size-4" /> Cada convidado inclui o aluguel de taça/copo.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Degustação opcional: {formatCurrency(tastingPrice)} por pessoa, cobrada à parte.
      </p>
    </StepShell>
  );
}