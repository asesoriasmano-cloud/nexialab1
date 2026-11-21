import { z } from "zod";

/**
 * Contratos de entrada/salida entre agentes. Cada salida de un LLM se valida contra estos schemas
 * (structured outputs en la API + validación zod local). Si un agente cambia su salida, cambia aquí.
 */

export const DeliverableKind = z.enum(["guide_chapter", "template", "checklist", "prompts", "csv"]);
export type DeliverableKind = z.infer<typeof DeliverableKind>;

export const LanguageSchema = z.enum(["es", "en", "pt"]);

// ---------- Market Scout (fase 1: exploración divergente) → opportunities.json ----------
const Level = z.enum(["baja", "media", "alta"]);
export const OpportunitiesSchema = z.object({
  candidates: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      market: z.string(),
      language: LanguageSchema,
      /** Código ISO de 2 letras del país principal (mx, es, us, br…) o "" si es multipaís. */
      country: z.string(),
      segment: z.string(),
      problem: z.string(),
      productIdea: z.string(),
      whyNow: z.string(),
      demandEvidence: z.string(),
      confidence: Level,
      competition: Level,
      willingnessToPay: Level,
      buildability: Level,
      distributionPath: z.string(),
      /** 2–3 búsquedas cortas tal como las escribiría el público, en su idioma (para validar demanda gratis). */
      queries: z.array(z.string()),
      score: z.number(),
    }),
  ),
  selectedId: z.number(),
  selectionRationale: z.string(),
});
export type Opportunities = z.infer<typeof OpportunitiesSchema>;

// ---------- Market Scout (fase 2: concepto elegido) → brief.json ----------
export const BriefSchema = z.object({
  /** id de la oportunidad elegida en opportunities.json. */
  opportunityId: z.number(),
  productName: z.string(),
  oneLiner: z.string(),
  niche: z.string(),
  market: z.string(),
  language: LanguageSchema,
  targetAudience: z.object({
    persona: z.string(),
    pains: z.array(z.string()),
    jobsToBeDone: z.array(z.string()),
  }),
  demandSignals: z.array(
    z.object({
      signal: z.string(),
      evidence: z.string(),
      confidence: z.enum(["alta", "media", "baja"]),
    }),
  ),
  keywords: z.array(
    z.object({
      term: z.string(),
      intent: z.enum(["informacional", "comercial", "transaccional"]),
      priority: z.enum(["alta", "media", "baja"]),
    }),
  ),
  competitors: z.array(
    z.object({ name: z.string(), offer: z.string(), price: z.string(), weakness: z.string() }),
  ),
  gap: z.string(),
  mvp: z.object({
    format: z.string(),
    deliverables: z.array(z.object({ name: z.string(), kind: DeliverableKind, description: z.string() })),
    outOfScope: z.array(z.string()),
  }),
  pricing: z.object({ currency: z.string(), price: z.number(), rationale: z.string(), upsell: z.string() }),
  acceptanceCriteria: z.array(z.string()),
  viabilityScore: z.number(),
  risks: z.array(z.string()),
  assumptionsToValidate: z.array(z.string()),
});
export type Brief = z.infer<typeof BriefSchema>;

// ---------- Product Builder → product/manifest.json ----------
export const ManifestSchema = z.object({
  productName: z.string(),
  slug: z.string(),
  guideTitle: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      kind: DeliverableKind,
      title: z.string(),
      purpose: z.string(),
      targetWords: z.number(),
    }),
  ),
});
export type Manifest = z.infer<typeof ManifestSchema>;

// ---------- QA & Critic → reports/qa-*.json ----------
export const DefectSchema = z.object({
  severity: z.enum(["blocker", "major", "minor"]),
  file: z.string().nullable(),
  issue: z.string(),
  fix: z.string(),
});

export const QaReviewSchema = z.object({
  verdict: z.enum(["approve", "reject"]),
  score: z.number(),
  summary: z.string(),
  valueProposition: z.string(),
  defects: z.array(DefectSchema),
});
export type QaReview = z.infer<typeof QaReviewSchema>;

// ---------- Growth & Copy → marketing/ ----------
export const GrowthPackSchema = z.object({
  seo: z.object({
    title: z.string(),
    metaDescription: z.string(),
    slug: z.string(),
    keywords: z.array(z.string()),
  }),
  listing: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    price: z.number(),
    tags: z.array(z.string()),
  }),
  emails: z.array(z.object({ day: z.number(), subject: z.string(), preview: z.string(), body: z.string() })),
  social: z.array(
    z.object({
      platform: z.enum(["linkedin", "instagram", "x", "facebook", "tiktok", "youtube", "pinterest", "reddit", "threads"]),
      hook: z.string(),
      text: z.string(),
    }),
  ),
});
export type GrowthPack = z.infer<typeof GrowthPackSchema>;

// ---------- Ops & Metrics → reports/ops-*.json ----------
export const OpsInsightsSchema = z.object({
  summary: z.string(),
  recommendations: z.array(
    z.object({
      priority: z.enum(["alta", "media", "baja"]),
      area: z.enum(["producto", "landing", "precio", "distribucion", "costos", "proceso"]),
      action: z.string(),
      rationale: z.string(),
    }),
  ),
});
export type OpsInsights = z.infer<typeof OpsInsightsSchema>;
