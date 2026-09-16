import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CATEGORY_META, type DrinkCategory } from "@/lib/pricing";

export function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="text-brand-red text-[0.65rem] tracking-[0.4em] uppercase">{eyebrow}</p>
      <h2 className="font-display mt-2 text-3xl leading-tight font-bold sm:text-4xl">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{label}</Label>
      {children}
      {error ? (
        <p className="text-brand-red text-xs">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  type?: string | undefined;
  inputMode?: "text" | "numeric" | "decimal" | undefined;
  maxLength?: number | undefined;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <Input
        value={value}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border-border bg-card text-base"
      />
    </Field>
  );
}

export function Counter({
  label,
  hint,
  value,
  onChange,
  max = 5000,
  min = 0,
}: {
  label: string;
  hint?: string | undefined;
  value: number;
  onChange: (value: number) => void;
  max?: number | undefined;
  min?: number | undefined;
}) {
  return (
    <div className="surface-card flex items-center justify-between gap-4 p-5">
      <div>
        <p className="font-display text-lg font-semibold">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="size-4" />
        </Button>
        <span className="font-display w-14 text-center text-2xl font-bold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function CategoryBadge({
  category,
  className,
}: {
  category: DrinkCategory;
  className?: string | undefined;
}) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.18em] uppercase",
        className,
      )}
      style={{ color: meta.token, backgroundColor: `color-mix(in oklab, ${meta.token} 12%, white)` }}
    >
      {meta.badge}
    </span>
  );
}

export function Stepper({
  steps,
  current,
  onSelect,
  maxReachable,
}: {
  steps: string[];
  current: number;
  onSelect: (index: number) => void;
  maxReachable: number;
}) {
  return (
    <nav className="w-full">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[0.62rem] tracking-[0.24em] uppercase">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step} className="flex items-center gap-2">
              <button
                type="button"
                disabled={index > maxReachable}
                onClick={() => onSelect(index)}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  active && "bg-foreground text-background",
                  !active && done && "text-brand-red",
                  !active && !done && "text-muted-foreground",
                  index > maxReachable && "cursor-not-allowed opacity-40",
                )}
              >
                {step}
              </button>
              {index < steps.length - 1 ? (
                <span className="h-px w-4 bg-border sm:w-6" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((current + 1) / steps.length) * 100}%`,
            background: "var(--gradient-red)",
          }}
        />
      </div>
    </nav>
  );
}