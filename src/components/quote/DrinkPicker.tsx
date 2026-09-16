import { Check, GlassWater } from "lucide-react";

import { CategoryBadge } from "@/components/quote/parts";
import { CATEGORY_META, CATEGORY_ORDER, type DrinkCategory } from "@/lib/pricing";
import type { Drink } from "@/lib/quote-state";
import { cn } from "@/lib/utils";

function DrinkCard({
  drink,
  selected,
  disabled,
  onToggle,
}: {
  drink: Drink;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[drink.category];
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={cn(
        "group surface-card relative flex flex-col overflow-hidden p-0 text-left transition-all duration-300",
        selected ? "shadow-lift -translate-y-0.5" : "hover:shadow-lift hover:-translate-y-0.5",
        disabled && !selected && "cursor-not-allowed opacity-45",
      )}
      style={selected ? { borderColor: meta.token, borderWidth: 2 } : undefined}
    >
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(150deg, color-mix(in oklab, ${meta.token} 14%, white), color-mix(in oklab, ${meta.token} 4%, white))`,
        }}
      >
        {drink.image_url ? (
          <img
            src={drink.image_url}
            alt={drink.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <GlassWater className="size-12 opacity-35" style={{ color: meta.token }} />
        )}
        <span
          className={cn(
            "absolute top-3 right-3 flex size-7 items-center justify-center rounded-full transition-all",
            selected ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
          style={{ backgroundColor: meta.token }}
        >
          <Check className="size-4 text-white" strokeWidth={3} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="script-title text-2xl leading-tight">{drink.name}</h3>
        </div>
        {drink.base_spirits ? (
          <p className="text-xs font-semibold tracking-[0.12em] uppercase">{drink.base_spirits}</p>
        ) : null}
        <ul className="flex-1 space-y-0.5 text-xs text-muted-foreground">
          {drink.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
        <CategoryBadge category={drink.category} className="self-start" />
      </div>
    </button>
  );
}

export function DrinkPicker({
  drinks,
  selectedIds,
  maxDrinks,
  onToggle,
}: {
  drinks: Drink[];
  selectedIds: string[];
  maxDrinks: number;
  onToggle: (drink: Drink) => void;
}) {
  const limitReached = selectedIds.length >= maxDrinks;
  return (
    <div className="space-y-12">
      {CATEGORY_ORDER.map((category: DrinkCategory) => {
        const items = drinks.filter((drink) => drink.category === category);
        if (items.length === 0) return null;
        const meta = CATEGORY_META[category];
        return (
          <div key={category}>
            <div className="flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: meta.token }} />
              <div>
                <h3 className="font-display text-xl font-bold">{meta.label}</h3>
                <p className="text-[0.62rem] tracking-[0.3em] uppercase" style={{ color: meta.token }}>
                  {meta.badge}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((drink) => (
                <DrinkCard
                  key={drink.id}
                  drink={drink}
                  selected={selectedIds.includes(drink.id)}
                  disabled={limitReached}
                  onToggle={() => onToggle(drink)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}