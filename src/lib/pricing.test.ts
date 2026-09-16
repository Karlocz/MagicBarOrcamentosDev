import { describe, expect, it } from "vitest";

import {
  computeQuote,
  freightForDistance,
  packagePrice,
  type DrinkCategory,
  type PricingSettings,
} from "./pricing";

const settings: PricingSettings = {
  base_4_drinks: 29,
  base_5_drinks: 30,
  base_6_drinks: 31,
  purple_1_drink: 35,
  purple_2_plus_drinks: 36,
  blue_1_drink: 40,
  blue_2_plus_drinks: 41,
  green_initial_price: 45,
  green_increment: 1,
  glass_rental_per_person: 3,
  child_percentage: 50,
  minimum_drinks: 4,
  maximum_drinks: 6,
  minimum_freight: 100,
  freight_per_km: 2,
  freight_included_km: 30,
  maximum_distance_km: 120,
};

const of = (spec: Partial<Record<DrinkCategory, number>>): DrinkCategory[] => {
  const out: DrinkCategory[] = [];
  (Object.keys(spec) as DrinkCategory[]).forEach((category) => {
    for (let i = 0; i < (spec[category] ?? 0); i += 1) out.push(category);
  });
  return out;
};

const price = (spec: Partial<Record<DrinkCategory, number>>) =>
  packagePrice(of(spec), settings).pricePerPerson;

describe("básicos por quantidade", () => {
  it("4 básicos → 29", () => expect(price({ basic: 4 })).toBe(29));
  it("5 básicos → 30", () => expect(price({ basic: 5 })).toBe(30));
  it("6 básicos → 31", () => expect(price({ basic: 6 })).toBe(31));
});

describe("roxo (premium)", () => {
  it("1 roxo → 35", () => expect(price({ purple: 1 })).toBe(35));
  it("2 roxos → 36", () => expect(price({ purple: 2 })).toBe(36));
  it("6 roxos → 36", () => expect(price({ purple: 6 })).toBe(36));
});

describe("azul (super premium)", () => {
  it("1 azul → 40", () => expect(price({ blue: 1 })).toBe(40));
  it("2 azuis → 41", () => expect(price({ blue: 2 })).toBe(41));
  it("3 azuis → 41", () => expect(price({ blue: 3 })).toBe(41));
});

describe("verde (whisky, incremental)", () => {
  it("1 verde → 45", () => expect(price({ green: 1 })).toBe(45));
  it("2 verdes → 46", () => expect(price({ green: 2 })).toBe(46));
  it("3 verdes → 47", () => expect(price({ green: 3 })).toBe(47));
  it("5 verdes → 49", () => expect(price({ green: 5 })).toBe(49));
});

describe("hierarquia de categorias", () => {
  it("3 básicos + 1 roxo → 35", () => expect(price({ basic: 3, purple: 1 })).toBe(35));
  it("2 básicos + 2 roxos → 36", () => expect(price({ basic: 2, purple: 2 })).toBe(36));
  it("3 básicos + 1 azul → 40", () => expect(price({ basic: 3, blue: 1 })).toBe(40));
  it("roxo + azul → aplica azul", () => expect(price({ purple: 3, blue: 1 })).toBe(40));
  it("2 básicos + 2 roxos + 1 azul → 40", () =>
    expect(price({ basic: 2, purple: 2, blue: 1 })).toBe(40));
  it("2 básicos + 2 roxos + 1 verde → 45", () =>
    expect(price({ basic: 2, purple: 2, green: 1 })).toBe(45));
  it("2 básicos + 2 roxos + 2 verdes → 46", () =>
    expect(price({ basic: 2, purple: 2, green: 2 })).toBe(46));
  it("categorias inferiores + verde → regra verde", () =>
    expect(price({ basic: 1, purple: 1, blue: 2, green: 3 })).toBe(47));
  it("categoria aplicada é a de maior nível", () =>
    expect(packagePrice(of({ basic: 3, green: 1 }), settings).appliedCategory).toBe("green"));
});

describe("frete base + km excedentes", () => {
  it("20 km → frete base", () => expect(freightForDistance(20, settings)).toBe(100));
  it("30 km → frete base", () => expect(freightForDistance(30, settings)).toBe(100));
  it("40 km → base + 10 km", () => expect(freightForDistance(40, settings)).toBe(120));
  it("50 km → base + 20 km", () => expect(freightForDistance(50, settings)).toBe(140));
  it("80 km → base + 50 km", () => expect(freightForDistance(80, settings)).toBe(200));
  it("sem distância → 0", () => expect(freightForDistance(null, settings)).toBe(0));
});

describe("orçamento completo", () => {
  it("adulto e criança incluem aluguel de taça", () => {
    const quote = computeQuote({
      categories: of({ basic: 4 }),
      adults: 100,
      children: 10,
      distanceKm: 40,
      settings,
    });
    expect(quote.adultUnit).toBe(32);
    expect(quote.childUnit).toBe(17.5);
    expect(quote.adultsTotal).toBe(3200);
    expect(quote.childrenTotal).toBe(175);
    expect(quote.freight).toBe(120);
    expect(quote.total).toBe(3495);
  });
});