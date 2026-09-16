import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import heroBar from "@/assets/hero-bar.jpg";
import { BrandHeader } from "@/components/BrandHeader";
import { DrinkPicker } from "@/components/quote/DrinkPicker";
import { FinalQuote } from "@/components/quote/FinalQuote";
import { StepShell, Stepper } from "@/components/quote/parts";
import {
  DesktopSummary,
  MobileSummaryBar,
  SummaryContent,
} from "@/components/quote/SummaryPanel";
import { ClientStep, EventStep, GuestsStep, VenueStep } from "@/components/quote/steps";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  estimateFreight,
  getCatalog,
  saveQuote,
} from "@/lib/catalog.functions";
import { computeQuote, formatBRL, isValidCPF, type PricingSettings } from "@/lib/pricing";
import {
  honoreeNames,
  initialForm,
  loadDraft,
  saveDraft,
  type Drink,
  type FreightResult,
  type QuoteForm,
} from "@/lib/quote-state";

const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "MAGIC BAR Eventos — Orçamento de Open Bar" },
      {
        name: "description",
        content:
          "Monte o cardápio de drinks do seu casamento, debutante ou aniversário e receba o orçamento completo da MAGIC BAR na hora.",
      },
      { property: "og:title", content: "MAGIC BAR Eventos — Orçamento de Open Bar" },
      {
        property: "og:description",
        content:
          "Escolha de 4 a 6 drinks, informe os convidados e veja o valor por pessoa, o frete e o total em tempo real.",
      },
    ],
  }),
  component: QuotePage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o cardápio agora. Atualize a página em instantes.
      </p>
    </div>
  ),
});

const STEPS = ["Contratante", "Evento", "Local", "Convidados", "Drinks", "Orçamento"];

function QuotePage() {
  const { data } = useSuspenseQuery(catalogQuery);
  const drinks = data.drinks as Drink[];
  const settings = data.settings;
  const minimumGuests = Number(settings?.minimum_guests ?? 50);
  const tastingPrice = Number(settings?.tasting_price_per_person ?? 0);


  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState<QuoteForm>(initialForm);
  const [freight, setFreight] = useState<FreightResult>({ status: "idle" });
  const [quoteRef, setQuoteRef] = useState<{ id: string | null; token: string | null }>({
    id: null,
    token: null,
  });
  const lastPrice = useRef(0);
  const draftLoaded = useRef(false);

  // Rascunho local: o cliente pode fechar a página e continuar depois.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setForm(draft.form);
      setQuoteRef({ id: draft.quoteId ?? null, token: draft.token ?? null });
    }
    draftLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) return;
    saveDraft({ form, quoteId: quoteRef.id, token: quoteRef.token });
  }, [form, quoteRef]);


  const pricing = useMemo<PricingSettings>(
    () => ({
      base_4_drinks: Number(settings?.base_4_drinks ?? 0),
      base_5_drinks: Number(settings?.base_5_drinks ?? 0),
      base_6_drinks: Number(settings?.base_6_drinks ?? 0),
      purple_1_drink: Number(settings?.purple_1_drink ?? 0),
      purple_2_plus_drinks: Number(settings?.purple_2_plus_drinks ?? 0),
      blue_1_drink: Number(settings?.blue_1_drink ?? 0),
      blue_2_plus_drinks: Number(settings?.blue_2_plus_drinks ?? 0),
      green_initial_price: Number(settings?.green_initial_price ?? 0),
      green_increment: Number(settings?.green_increment ?? 0),
      glass_rental_per_person: Number(settings?.glass_rental_per_person ?? 0),
      child_percentage: Number(settings?.child_percentage ?? 50),
      minimum_drinks: Number(settings?.minimum_drinks ?? 4),
      maximum_drinks: Number(settings?.maximum_drinks ?? 6),
      minimum_freight: Number(settings?.minimum_freight ?? 0),
      freight_per_km: Number(settings?.freight_per_km ?? 0),
      freight_included_km: Number(settings?.freight_included_km ?? 0),
      maximum_distance_km: Number(settings?.maximum_distance_km ?? 0),
    }),
    [settings],
  );

  const selectedDrinks = useMemo(
    () => form.drinkIds.map((id) => drinks.find((drink) => drink.id === id)).filter(Boolean) as Drink[],
    [form.drinkIds, drinks],
  );

  const math = useMemo(
    () =>
      computeQuote({
        categories: selectedDrinks.map((drink) => drink.category),
        adults: form.adults,
        children: form.children,
        distanceKm: freight.status === "ok" ? freight.distanceKm : null,
        settings: pricing,
      }),
    [selectedDrinks, form.adults, form.children, freight, pricing],
  );

  function update<K extends keyof QuoteForm>(key: K, value: QuoteForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleDrink(drink: Drink) {
    const selected = form.drinkIds.includes(drink.id);
    const nextIds = selected
      ? form.drinkIds.filter((id) => id !== drink.id)
      : form.drinkIds.length >= pricing.maximum_drinks
        ? form.drinkIds
        : [...form.drinkIds, drink.id];
    if (nextIds === form.drinkIds) {
      toast.info(`Máximo de ${pricing.maximum_drinks} drinks por cardápio.`);
      return;
    }
    const nextCategories = nextIds
      .map((id) => drinks.find((item) => item.id === id)?.category)
      .filter(Boolean) as Drink["category"][];
    const next = computeQuote({
      categories: nextCategories,
      adults: form.adults,
      children: form.children,
      distanceKm: freight.status === "ok" ? freight.distanceKm : null,
      settings: pricing,
    });
    if (next.pricePerPerson > math.pricePerPerson && math.pricePerPerson > 0) {
      toast(`Drink ${drink.name} adicionado`, {
        description: `${formatBRL(math.pricePerPerson)} → ${formatBRL(next.pricePerPerson)} por pessoa`,
      });
    }
    lastPrice.current = next.pricePerPerson;
    update("drinkIds", nextIds);
  }

  async function estimate() {
    if (form.address.trim().length < 3 || form.city.trim().length < 2) {
      toast.error("Informe endereço e cidade para calcular o frete.");
      return;
    }
    setFreight({ status: "loading" });
    try {
      const result = await estimateFreight({
        data: {
          address: form.address,
          number: form.addressNumber,
          city: form.city,
          state: form.state || "SP",
          cep: form.cep,
        },
      });
      if (result.ok) {
        setFreight({
          status: "ok",
          distanceKm: result.distanceKm,
          durationMinutes: result.durationMinutes,
          freight: result.freight,
          originAddress: result.originAddress,
          origin: result.origin,
          destination: result.destination,
          destinationLabel: result.destinationLabel,
        });
      } else if (result.reason === "out_of_state") {
        setFreight({
          status: "out_of_state",
          message: result.message,
          city: result.city,
          state: result.state,
        });
      } else if (result.reason === "out_of_range") {
        setFreight({
          status: "out_of_range",
          message: result.message,
          distanceKm: result.distanceKm,
          maxKm: result.maxKm,
        });
      } else {
        setFreight({ status: "error", message: result.message });
      }
    } catch {
      setFreight({
        status: "error",
        message: "Não conseguimos calcular a distância agora. Tente novamente.",
      });
    }
  }

  function stepIsValid(index: number): boolean {
    if (index === 0) return form.clientName.trim().length >= 3 && isValidCPF(form.clientCpf);
    if (index === 1) return Boolean(form.eventType);
    if (index === 2) return freight.status === "ok";
    if (index === 3) return form.adults + form.children >= minimumGuests;
    if (index === 4)
      return (
        form.drinkIds.length >= pricing.minimum_drinks &&
        form.drinkIds.length <= pricing.maximum_drinks
      );
    return true;
  }

  function goTo(index: number) {
    setShowErrors(false);
    setStep(index);
    setMaxReached((current) => Math.max(current, index));
  }

  /** Uma única gravação para rascunho e orçamento enviado (mesma linha via id + token). */
  async function persist(status: "draft" | "sent") {
    const result = await saveQuote({
      data: {
        quote_id: quoteRef.id,
        public_token: quoteRef.token,
        status,
        client_name: form.clientName || "Rascunho",
        client_cpf: form.clientCpf || "00000000000",
        event_type: form.eventType ?? "",
        honoree_names: honoreeNames(form),
        event_date: form.eventDate || null,
        buffet_time: form.buffetTime || null,
        bar_time: form.barTime || null,
        dj_time: form.djTime || null,
        cep: form.cep || null,
        address: form.address || null,
        address_number: form.addressNumber || null,
        address_complement: form.addressComplement || null,
        city: form.city || null,
        state: form.state || null,
        distance_km: freight.status === "ok" ? freight.distanceKm : null,
        adults: form.adults,
        children: form.children,
        drink_ids: form.drinkIds,
      },
    });
    setQuoteRef({ id: result.id, token: result.public_token });
    return result;
  }

  async function saveAsDraft() {
    try {
      await persist("draft");
      toast.success("Rascunho salvo. Você pode continuar depois neste dispositivo.");
    } catch {
      toast.error("Não foi possível salvar o rascunho agora.");
    }
  }

  async function next() {
    if (!stepIsValid(step)) {
      setShowErrors(true);
      if (step === 4) {
        toast.error(`Escolha de ${pricing.minimum_drinks} a ${pricing.maximum_drinks} drinks.`);
      }
      return;
    }
    if (step === 4) {
      try {
        await persist("sent");
      } catch {
        toast.error("Não foi possível registrar o orçamento, mas você pode continuar.");
      }
    }
    goTo(Math.min(STEPS.length - 1, step + 1));
  }

  const summaryProps = {
    math,
    drinkCount: form.drinkIds.length,
    maxDrinks: pricing.maximum_drinks,
    adults: form.adults,
    children: form.children,
  };

  return (
    <div className="min-h-screen pb-28 lg:pb-10">
      <BrandHeader subtitle="Gerador de orçamentos" />

      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroBar}
          alt="Bartender da MAGIC BAR preparando um drink autoral em evento"
          width={1600}
          height={1008}
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/25 to-transparent p-6 sm:p-10">
          <div className="max-w-xl text-white">
            <p className="text-[0.62rem] tracking-[0.4em] uppercase opacity-80">
              Casamentos · Debutantes · Aniversários
            </p>
            <h1 className="font-display mt-2 text-3xl leading-tight font-bold sm:text-5xl">
              Monte seu open bar e veja o orçamento na hora
            </h1>
            <p className="mt-2 text-sm opacity-85">
              Escolha de {pricing.minimum_drinks} a {pricing.maximum_drinks} drinks. O valor por
              pessoa é definido pelo cardápio, mais {formatBRL(pricing.glass_rental_per_person)} de
              taça e o frete até o local.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Stepper steps={STEPS} current={step} onSelect={goTo} maxReachable={maxReached} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {step === 0 ? (
              <ClientStep form={form} update={update} showErrors={showErrors} />
            ) : null}
            {step === 1 ? <EventStep form={form} update={update} showErrors={showErrors} /> : null}
            {step === 2 ? (
              <VenueStep
                form={form}
                update={update}
                freight={freight}
                onEstimate={estimate}
                onReset={() => setFreight({ status: "idle" })}
                showErrors={showErrors}
                formatCurrency={formatBRL}
                whatsappNumber={settings?.whatsapp_number ?? ""}
              />
            ) : null}
            {step === 3 ? (
              <GuestsStep
                form={form}
                update={update}
                adultUnit={math.adultUnit}
                childUnit={math.childUnit}
                minimumGuests={minimumGuests}
                tastingPrice={tastingPrice}
                formatCurrency={formatBRL}
              />
            ) : null}
            {step === 4 ? (
              <StepShell
                eyebrow="Etapa 5"
                title="Monte seu cardápio"
                description={`Escolha de ${pricing.minimum_drinks} a ${pricing.maximum_drinks} drinks — ${form.drinkIds.length} / ${pricing.maximum_drinks} selecionados.`}
              >
                <DrinkPicker
                  drinks={drinks}
                  selectedIds={form.drinkIds}
                  maxDrinks={pricing.maximum_drinks}
                  onToggle={toggleDrink}
                />
              </StepShell>
            ) : null}
            {step === 5 ? (
              <StepShell eyebrow="Etapa 6" title="Seu orçamento">
                <FinalQuote
                  form={form}
                  math={math}
                  drinks={selectedDrinks}
                  distanceKm={freight.status === "ok" ? freight.distanceKm : null}
                  whatsappNumber={settings?.whatsapp_number ?? ""}
                  quoteId={quoteRef.id}
                  publicToken={quoteRef.token}
                  originAddress={freight.status === "ok" ? freight.originAddress : String(settings?.origin_address ?? "")}
                  onEdit={() => goTo(4)}
                />
              </StepShell>
            ) : null}

            {step < 5 ? (
              <div className="mt-10 flex items-center justify-between gap-3 print:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-xl"
                  disabled={step === 0}
                  onClick={() => goTo(step - 1)}
                >
                  <ArrowLeft className="mr-2 size-4" /> Voltar
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={() => void saveAsDraft()}
                  >
                    Salvar rascunho
                  </Button>
                  <Button type="button" className="h-12 rounded-xl px-6" onClick={() => void next()}>
                    {step === 4 ? "Ver orçamento" : "Continuar"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DesktopSummary {...summaryProps} />
        </div>

        <p className="mt-16 flex items-center justify-center gap-2 text-xs text-muted-foreground print:hidden">
          <Sparkles className="size-3.5" /> MAGIC BAR Eventos ·{" "}
          <Link to="/auth" className="inline-flex items-center gap-1 hover:text-foreground">
            <Lock className="size-3" /> Área administrativa
          </Link>
        </p>
      </main>

      {step < 5 ? (
        <Sheet>
          <SheetTrigger asChild>
            <div>
              <MobileSummaryBar
                math={math}
                drinkCount={form.drinkIds.length}
                onOpen={() => undefined}
                ctaLabel="Ver orçamento"
                disabled={false}
              />
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetTitle className="sr-only">Resumo do orçamento</SheetTitle>
            <div className="p-6">
              <SummaryContent {...summaryProps} />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}