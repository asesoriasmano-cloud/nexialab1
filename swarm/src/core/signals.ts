import type { ProductLanguage } from "../config.ts";

/**
 * Señales de demanda GRATUITAS (US$0, sin API key):
 *  - Google Suggest: lo que la gente realmente escribe en Google, por idioma y país.
 *  - YouTube Suggest: demanda de "cómo hacer…" (buena señal para guías).
 * Son endpoints públicos de autocompletado: se usan con moderación (pocas consultas, concurrencia baja)
 * y cualquier fallo de red se tolera sin detener el enjambre.
 */

const INTENT_MODIFIERS: Record<ProductLanguage, string[]> = {
  es: ["plantilla", "cómo", "excel"],
  en: ["template", "how to", "checklist"],
  pt: ["planilha", "como", "modelo"],
};

/** Palabras que indican intención de conseguir un recurso descargable (lo que vende un kit). */
const COMMERCIAL_RE =
  /plantilla|excel|formato|modelo|checklist|lista|guía|guia|pdf|descargar|gratis|template|spreadsheet|planner|printable|download|planilha|baixar|ebook|kit/i;

export interface CandidateSignals {
  id: number;
  queries: string[];
  google: string[];
  youtube: string[];
  /** Sugerencias distintas encontradas (más = más demanda observable). */
  suggestionCount: number;
  /** Sugerencias con intención de recurso descargable (plantilla, excel, template…). */
  commercialCount: number;
  /** 0–100, solo indicativo: combina volumen de sugerencias e intención comercial. */
  signalScore: number;
  errors: number;
}

interface SuggestOpts {
  hl: ProductLanguage;
  gl?: string;
  youtube?: boolean;
  timeoutMs?: number;
}

export async function suggest(q: string, opts: SuggestOpts): Promise<string[]> {
  const params = new URLSearchParams({ client: "firefox", hl: opts.hl, q });
  if (opts.gl) params.set("gl", opts.gl);
  if (opts.youtube) params.set("ds", "yt");
  const res = await fetch(`https://suggestqueries.google.com/complete/search?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; market-research)" },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // La respuesta puede venir en latin-1 según el idioma: decodificamos según el charset indicado.
  const charset = /charset=([^;]+)/i.exec(res.headers.get("content-type") ?? "")?.[1] ?? "utf-8";
  const text = new TextDecoder(charset.trim().toLowerCase()).decode(await res.arrayBuffer());
  const data = JSON.parse(text) as [string, string[]];
  return Array.isArray(data[1]) ? data[1] : [];
}

/** Ejecuta tareas con concurrencia limitada (amable con los endpoints públicos). */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function collectSignals(
  candidates: Array<{ id: number; language: ProductLanguage; country: string; queries: string[] }>,
): Promise<CandidateSignals[]> {
  return pool(candidates, 2, async (c) => {
    const gl = /^[a-z]{2}$/i.test(c.country) ? c.country.toLowerCase() : undefined;
    const base = c.queries.slice(0, 3).map((q) => q.trim()).filter(Boolean);
    const googleQueries = [...base, ...INTENT_MODIFIERS[c.language].map((m) => `${m} ${base[0] ?? ""}`.trim())];
    const google = new Set<string>();
    const youtube = new Set<string>();
    let errors = 0;

    for (const q of googleQueries) {
      try {
        for (const s of await suggest(q, { hl: c.language, gl })) google.add(s);
      } catch {
        errors++;
      }
    }
    for (const q of base.slice(0, 2)) {
      try {
        for (const s of await suggest(q, { hl: c.language, gl, youtube: true })) youtube.add(s);
      } catch {
        errors++;
      }
    }

    const all = [...google, ...youtube];
    const commercialCount = all.filter((s) => COMMERCIAL_RE.test(s)).length;
    const signalScore = Math.min(100, Math.round(all.length * 1.2 + commercialCount * 5));
    return {
      id: c.id,
      queries: base,
      google: [...google].slice(0, 25),
      youtube: [...youtube].slice(0, 10),
      suggestionCount: all.length,
      commercialCount,
      signalScore,
      errors,
    };
  });
}
