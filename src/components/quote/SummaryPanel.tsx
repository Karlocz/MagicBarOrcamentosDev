import { ArrowRight } from "lucide-react";

import { CategoryBadge } from "@/components/quote/parts";
import { Button } from "@/components/ui/button";
import { formatBRL, type QuoteMath } from "@/lib/pricing";

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function SummaryContent({
  math,
  drinkCount,
  maxDrinks,
  adults,
  children,
}: {
  math: QuoteMath;
  drinkCount: number;
  maxDrinks: number;
  adults: number;
  children: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.62rem] tracking-[0.32em] text-muted-foreground uppercase">
          Resumo do orçamento
        </p>
        {math.appliedCategory ? <CategoryBadge category={math.appliedCategory} /> : null}
      </div>
      <div>
        <p className="font-display text-3xl font-bold">
          {formatBRL(math.pricePerPerson)}
          <span className="text-sm font-normal text-muted-foreground"> / pessoa</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {drinkCount} de {maxDrinks} drinks selecionados
        </p>
      </div>
      <div className="space-y-1.5 border-t border-border pt-4">
        <Line label="Aluguel taça/copo" value={`${formatBRL(math.glassRental)} / pessoa`} muted />
        <Line
          label={`Adultos (${adults} × ${formatBRL(math.adultUnit)})`}
          value={formatBRL(math.adultsTotal)}
        />
        <Line
          label={`Crianças (${children} × ${formatBRL(math.childUnit)})`}
          value={formatBRL(math.childrenTotal)}
        />
        <Line label="Frete" value={formatBRL(math.freight)} />
      </div>
      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-xs tracking-[0.28em] uppercase">Total</span>
        <span className="font-display text-brand-red text-2xl font-bold tabular-nums">
          {formatBRL(math.total)}
        </span>
      </div>
    </div>
  );
}

export function DesktopSummary(props: Parameters<typeof SummaryContent>[0]) {
  return (
    <aside className="hidden lg:block">
      <div className="surface-card sticky top-6 p-6">
        <SummaryContent {...props} />
      </div>
    </aside>
  );
}

export function MobileSummaryBar({
  math,
  drinkCount,
  onOpen,
  ctaLabel,
  disabled,
}: {
  math: QuoteMath;
  drinkCount: number;
  onOpen: () => void;
  ctaLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.62rem] tracking-[0.24em] text-muted-foreground uppercase">
            {drinkCount} drinks · {formatBRL(math.pricePerPerson)} / pessoa
          </p>
          <p className="font-display text-lg font-bold">{formatBRL(math.total)}</p>
        </div>
        <Button onClick={onOpen} disabled={disabled} className="h-11 rounded-xl">
          {ctaLabel}
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    </div>
  );
}