/** Geocodificação de endereços brasileiros (ViaCEP + Nominatim) com validação de UF. */

const UF_BY_NAME: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

export function toUf(value: string | undefined | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^estado (de|do|da) /, "");
  return UF_BY_NAME[normalized] ?? null;
}

const NAME_BY_UF = Object.fromEntries(
  Object.entries(UF_BY_NAME).map(([name, uf]) => [uf, name.replace(/\b\w/g, (c) => c.toUpperCase())]),
);

export type GeocodeHit = {
  point: [number, number];
  uf: string | null;
  city: string | null;
  /** street | neighborhood | city — precisão da coordenada encontrada. */
  precision: "street" | "neighborhood" | "city";
  label: string;
};

export type AddressInput = {
  address: string;
  number?: string | null | undefined;
  city: string;
  state: string;
  cep?: string | null | undefined;
};

type ViaCep = {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

/** ViaCEP resolve rua/bairro/cidade/UF oficiais — nunca use o CEP cru no Nominatim (retorna outro estado). */
async function lookupCep(cep: string | null | undefined): Promise<ViaCep | null> {
  const digits = (cep ?? "").replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ViaCep;
    if (json.erro) return null;
    return json;
  } catch {
    return null;
  }
}

type NominatimRow = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: {
    state?: string;
    ["ISO3166-2-lvl4"]?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
};

async function nominatim(query: string): Promise<NominatimRow[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=br&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MagicBarEventos/1.0 (orcamentos)", Accept: "application/json" },
    });
    if (!res.ok) return [];
    return (await res.json()) as NominatimRow[];
  } catch {
    return [];
  }
}

function rowCity(row: NominatimRow): string | null {
  const a = row.address;
  return a?.city ?? a?.town ?? a?.village ?? a?.municipality ?? null;
}

function rowUf(row: NominatimRow): string | null {
  const iso = row.address?.["ISO3166-2-lvl4"];
  return toUf(iso ? iso.replace("BR-", "") : row.address?.state);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Limpa "R. X, 252 - Bairro, Cidade - SP" deixando apenas o logradouro. */
function cleanStreet(value: string): string {
  return (value.split(/\s+-\s+/)[0] ?? value).split(",")[0]?.trim() ?? value;
}

/**
 * Geocodifica com fallback progressivo: rua -> bairro -> cidade.
 * Só aceita resultados na UF (e, quando possível, na cidade) informada.
 */
export async function geocodeAddress(input: AddressInput): Promise<GeocodeHit | null> {
  const viaCep = await lookupCep(input.cep);
  const uf = toUf(viaCep?.uf) ?? toUf(input.state);
  const city = viaCep?.localidade ?? input.city;
  const stateName = uf ? (NAME_BY_UF[uf] ?? uf) : input.state;
  const street = cleanStreet(input.address);
  const bairro = viaCep?.bairro ?? null;

  const candidates: Array<{ query: string; precision: GeocodeHit["precision"] }> = [];
  const push = (query: string | null, precision: GeocodeHit["precision"]) => {
    if (query && !candidates.some((c) => c.query === query)) candidates.push({ query, precision });
  };

  if (viaCep?.logradouro) {
    push(`${viaCep.logradouro}, ${city}, ${stateName}, Brasil`, "street");
  }
  push(
    `${street}${input.number ? `, ${input.number}` : ""}, ${city}, ${stateName}, Brasil`,
    "street",
  );
  push(`${street}, ${city}, ${stateName}, Brasil`, "street");
  if (bairro) push(`${bairro}, ${city}, ${stateName}, Brasil`, "neighborhood");
  push(`${city}, ${stateName}, Brasil`, "city");

  for (const candidate of candidates) {
    const rows = await nominatim(candidate.query);
    for (const row of rows) {
      const hitUf = rowUf(row);
      const hitCity = rowCity(row);
      if (uf && hitUf && hitUf !== uf) continue;
      if (
        candidate.precision !== "city" &&
        hitCity &&
        normalize(hitCity) !== normalize(city) &&
        !normalize(row.display_name ?? "").includes(normalize(city))
      ) {
        continue;
      }
      return {
        point: [Number(row.lat), Number(row.lon)],
        uf: hitUf ?? uf,
        city: hitCity ?? city,
        precision: candidate.precision,
        label: row.display_name ?? candidate.query,
      };
    }
  }
  return null;
}
