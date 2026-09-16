import { createFileRoute } from "@tanstack/react-router";

import { BrandHeader } from "@/components/BrandHeader";
import { TastingBooking } from "@/components/tasting/TastingBooking";

export const Route = createFileRoute("/degustacao")({
  head: () => ({ meta: [
    { title: "Agendar degustação — MAGIC BAR" },
    { name: "description", content: "Escolha uma data e reserve sua experiência de degustação de drinks da MAGIC BAR." },
    { property: "og:title", content: "Agendar degustação — MAGIC BAR" },
    { property: "og:description", content: "Reserve uma degustação de drinks de uma hora com a MAGIC BAR." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: TastingPage,
});

function TastingPage() {
  return <div className="min-h-screen pb-16"><BrandHeader subtitle="Agenda de degustação" /><main className="mx-auto max-w-4xl px-4 py-10"><h1 className="font-display text-4xl font-bold">Degustação MAGIC BAR</h1><p className="mt-2 max-w-2xl text-muted-foreground">Escolha uma data, veja todos os horários e reserve sua experiência.</p><section className="surface-card mt-8 p-6 sm:p-8"><TastingBooking /></section></main></div>;
}