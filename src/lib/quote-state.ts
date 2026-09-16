import type { DrinkCategory } from "./pricing";

export type Drink = {
  id: string;
  name: string;
  base_spirits: string;
  ingredients: string[];
  category: DrinkCategory;
  image_url: string | null;
  sort_order: number;
};

export type EventType = "noivos" | "debutante" | "aniversariante";

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  noivos: "Noivos",
  debutante: "Debutante",
  aniversariante: "Aniversariante",
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  sent: "Orçamento enviado",
  tasting_scheduled: "Degustação agendada",
  payment_pending: "Pagamento pendente",
  tasting_confirmed: "Degustação confirmada",
  contracted: "Contratado",
  cancelled: "Cancelado",
};

export type FreightResult =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok";
      distanceKm: number;
      durationMinutes: number;
      freight: number;
      originAddress: string;
      origin: [number, number];
      destination: [number, number];
      destinationLabel: string;
    }
  | { status: "out_of_state"; message: string; city: string; state: string }
  | { status: "out_of_range"; message: string; distanceKm: number; maxKm: number }
  | { status: "error"; message: string };

export type QuoteForm = {
  clientName: string;
  clientCpf: string;
  eventType: EventType | null;
  /** Nomenclatura neutra: qualquer combinação de pessoas nos noivos. */
  partner1Name: string;
  partner2Name: string;
  debutanteName: string;
  birthdayName: string;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  city: string;
  state: string;
  eventDate: string;
  buffetTime: string;
  barTime: string;
  djTime: string;
  adults: number;
  children: number;
  drinkIds: string[];
  tastingDate: string;
  tastingTime: string;
  tastingPeople: number;
};

export const initialForm: QuoteForm = {
  clientName: "",
  clientCpf: "",
  eventType: null,
  partner1Name: "",
  partner2Name: "",
  debutanteName: "",
  birthdayName: "",
  cep: "",
  address: "",
  addressNumber: "",
  addressComplement: "",
  city: "",
  state: "",
  eventDate: "",
  buffetTime: "",
  barTime: "",
  djTime: "",
  adults: 100,
  children: 0,
  drinkIds: [],
  tastingDate: "",
  tastingTime: "",
  tastingPeople: 2,
};

export function honoreeSummary(form: QuoteForm): string {
  if (form.eventType === "noivos") {
    return [form.partner1Name, form.partner2Name].filter(Boolean).join(" & ");
  }
  if (form.eventType === "debutante") return form.debutanteName;
  if (form.eventType === "aniversariante") return form.birthdayName;
  return "";
}

export function honoreeNames(form: QuoteForm): Record<string, string> {
  if (form.eventType === "noivos") {
    return { partner_1: form.partner1Name, partner_2: form.partner2Name };
  }
  if (form.eventType === "debutante") return { debutante: form.debutanteName };
  if (form.eventType === "aniversariante") return { aniversariante: form.birthdayName };
  return {};
}

/** Resumo dos homenageados a partir do jsonb salvo no banco (aceita registros antigos). */
export function honoreeSummaryFromRecord(names: Record<string, unknown> | null): string {
  if (!names) return "";
  const value = (key: string) => (typeof names[key] === "string" ? (names[key] as string) : "");
  const partners = [
    value("partner_1") || value("noivo"),
    value("partner_2") || value("noiva"),
  ].filter(Boolean);
  if (partners.length) return partners.join(" & ");
  return value("debutante") || value("aniversariante");
}

/** Rascunho salvo no navegador para o cliente continuar depois. */
const DRAFT_KEY = "magicbar.quote.draft";

export type DraftEnvelope = { form: QuoteForm; quoteId?: string | null; token?: string | null };

export function loadDraft(): DraftEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope;
    if (!parsed?.form) return null;
    return { ...parsed, form: { ...initialForm, ...parsed.form } };
  } catch {
    return null;
  }
}

export function saveDraft(envelope: DraftEnvelope): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(envelope));
  } catch {
    /* armazenamento indisponível */
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignorado */
  }
}

/** Horários de degustação com duração comercial fixa de uma hora. */
export function buildSlots(start: string, end: string, _intervalMinutes = 60): string[] {
  const toMinutes = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const from = toMinutes(start || "09:00");
  let to = toMinutes(end || "18:00");
  if (to === 0) to = 24 * 60;
  const slots: string[] = [];
  for (let minute = from; minute + 60 <= to; minute += 60) {
    slots.push(
      `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    );
  }
  return slots;
}
