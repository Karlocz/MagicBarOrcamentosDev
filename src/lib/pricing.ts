export type DrinkCategory = "basic" | "purple" | "blue" | "green";

export const CATEGORY_ORDER: DrinkCategory[] = ["basic", "purple", "blue", "green"];

export const CATEGORY_META: Record<
  DrinkCategory,
  { label: string; badge: string; token: string; ring: string; text: string; soft: string }
> = {
  basic: {
    label: "Básicos",
    badge: "CLÁSSICOS",
    token: "var(--cat-basic)",
    ring: "border-cat-basic",
    text: "text-cat-basic",
    soft: "bg-cat-basic/8",
  },
  purple: {
    label: "Premium",
    badge: "PREMIUM",
    token: "var(--cat-purple)",
    ring: "border-cat-purple",
    text: "text-cat-purple",
    soft: "bg-cat-purple/8",
  },
  blue: {
    label: "Super Premium",
    badge: "SUPER PREMIUM",
    token: "var(--cat-blue)",
    ring: "border-cat-blue",
    text: "text-cat-blue",
    soft: "bg-cat-blue/10",
  },
  green: {
    label: "Whisky / Premium Especial",
    badge: "WHISKY / PREMIUM ESPECIAL",
    token: "var(--cat-green)",
    ring: "border-cat-green",
    text: "text-cat-green",
    soft: "bg-cat-green/10",
  },
};

/** All price knobs come from the database — never hardcode them in components. */
export type PricingSettings = {
  base_4_drinks: number;
  base_5_drinks: number;
  base_6_drinks: number;
  purple_1_drink: number;
  purple_2_plus_drinks: number;
  blue_1_drink: number;
  blue_2_plus_drinks: number;
  green_initial_price: number;
  green_increment: number;
  glass_rental_per_person: number;
  child_percentage: number;
  minimum_drinks: number;
  maximum_drinks: number;
  /** Frete base — já inclui os primeiros quilômetros (freight_included_km). */
  minimum_freight: number;
  /** Valor cobrado por quilômetro que exceder os km incluídos no frete base. */
  freight_per_km: number;
  /** Quilômetros já cobertos pelo frete base. */
  freight_included_km: number;
  maximum_distance_km: number;
};

export function countByCategory(categories: DrinkCategory[]): Record<DrinkCategory, number> {
  const counts: Record<DrinkCategory, number> = { basic: 0, purple: 0, blue: 0, green: 0 };
  for (const category of categories) counts[category] += 1;
  return counts;
}

/** Highest selected category wins — prices are never summed across categories. */
export function highestCategory(categories: DrinkCategory[]): DrinkCategory | null {
  const counts = countByCategory(categories);
  for (const category of [...CATEGORY_ORDER].reverse()) {
    if (counts[category] > 0) return category;
  }
  return null;
}

export function packagePrice(
  categories: DrinkCategory[],
  settings: PricingSettings,
): { pricePerPerson: number; appliedCategory: DrinkCategory | null } {
  const applied = highestCategory(categories);
  if (!applied) return { pricePerPerson: 0, appliedCategory: null };
  const counts = countByCategory(categories);

  if (applied === "green") {
    const extra = Math.max(0, counts.green - 1);
    return {
      pricePerPerson: settings.green_initial_price + extra * settings.green_increment,
      appliedCategory: applied,
    };
  }
  if (applied === "blue") {
    return {
      pricePerPerson: counts.blue >= 2 ? settings.blue_2_plus_drinks : settings.blue_1_drink,
      appliedCategory: applied,
    };
  }
  if (applied === "purple") {
    return {
      pricePerPerson: counts.purple >= 2 ? settings.purple_2_plus_drinks : settings.purple_1_drink,
      appliedCategory: applied,
    };
  }

  const total = categories.length;
  const price =
    total <= 4
      ? settings.base_4_drinks
      : total === 5
        ? settings.base_5_drinks
        : settings.base_6_drinks;
  return { pricePerPerson: price, appliedCategory: applied };
}

/**
 * Frete = frete base + km excedentes × valor por km.
 * Os primeiros `freight_included_km` já estão pagos no frete base.
 */
export function freightForDistance(distanceKm: number | null, settings: PricingSettings): number {
  if (distanceKm == null) return 0;
  const included = Math.max(0, Number(settings.freight_included_km) || 0);
  const extraKm = Math.max(0, distanceKm - included);
  return settings.minimum_freight + extraKm * settings.freight_per_km;
}

export type QuoteMath = {
  pricePerPerson: number;
  appliedCategory: DrinkCategory | null;
  glassRental: number;
  adultUnit: number;
  childUnit: number;
  adultsTotal: number;
  childrenTotal: number;
  freight: number;
  total: number;
};

export function computeQuote(input: {
  categories: DrinkCategory[];
  adults: number;
  children: number;
  distanceKm: number | null;
  settings: PricingSettings;
}): QuoteMath {
  const { settings } = input;
  const { pricePerPerson, appliedCategory } = packagePrice(input.categories, settings);
  const glassRental = settings.glass_rental_per_person;
  const adultUnit = pricePerPerson + glassRental;
  const childUnit = pricePerPerson * (settings.child_percentage / 100) + glassRental;
  const adultsTotal = adultUnit * input.adults;
  const childrenTotal = childUnit * input.children;
  const freight = freightForDistance(input.distanceKm, settings);
  return {
    pricePerPerson,
    appliedCategory,
    glassRental,
    adultUnit,
    childUnit,
    adultsTotal,
    childrenTotal,
    freight,
    total: adultsTotal + childrenTotal + freight,
  };
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );
}

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += Number(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}