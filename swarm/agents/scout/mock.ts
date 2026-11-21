import type { Brief } from "../../src/schemas.ts";

/** Brief simulado para --dry-run. Sirve para probar el pipeline completo sin gastar tokens. */
export function mockBrief(niche: string, attempt: number): Brief {
  return {
    productName: attempt > 0 ? "Kit SDR Express v2 (simulado)" : "Kit SDR Express (simulado)",
    oneLiner: "Sistema listo para usar que agenda reuniones B2B desde LinkedIn en 30 minutos al día.",
    niche,
    targetAudience: {
      persona: "Dueño o dueña de una pyme de servicios B2B (5–30 personas) que vende por recomendación y quiere un canal outbound predecible.",
      pains: [
        "No sabe qué escribir en LinkedIn sin sonar a spam",
        "No tiene tiempo ni presupuesto para contratar un SDR",
        "No mide su prospección y no sabe qué funciona",
      ],
      jobsToBeDone: ["Agendar 4–8 reuniones calificadas al mes", "Ordenar el seguimiento de prospectos"],
    },
    demandSignals: [
      {
        signal: "Búsquedas recurrentes sobre plantillas de mensajes de LinkedIn en español",
        evidence: "Simulado: sin datos en vivo",
        confidence: "baja",
      },
    ],
    keywords: [
      { term: "plantillas mensajes linkedin ventas", intent: "comercial", priority: "alta" },
      { term: "cómo prospectar en linkedin", intent: "informacional", priority: "media" },
    ],
    competitors: [
      {
        name: "Plantillas gratuitas en blogs",
        offer: "Mensajes sueltos en inglés",
        price: "Gratis",
        weakness: "Sin sistema, sin seguimiento y sin adaptación a LatAm",
      },
    ],
    gap: "No existe un kit en español para LatAm que combine mensajes, cadencia, CRM simple y métricas en un solo sistema.",
    mvp: {
      format: "Guía PDF + plantillas Markdown + CRM en CSV",
      deliverables: [
        { name: "Fundamentos del outbound en LinkedIn", kind: "guide_chapter", description: "Perfil, ICP y propuesta de valor" },
        { name: "Cadencia de 14 días", kind: "guide_chapter", description: "Secuencia paso a paso con tiempos" },
        { name: "Métricas y mejora continua", kind: "guide_chapter", description: "Qué medir y cómo iterar" },
        { name: "Biblioteca de mensajes", kind: "template", description: "Mensajes de conexión, seguimiento y cierre" },
        { name: "CRM de prospección", kind: "csv", description: "Hoja con columnas de seguimiento y ejemplos" },
      ],
      outOfScope: ["Automatización con bots", "Video cursos"],
    },
    pricing: { currency: "USD", price: 19, rationale: "Ticket de impulso bajo el costo de una hora de consultoría.", upsell: "Sesión de implementación con Nexia Lab" },
    acceptanceCriteria: [
      "Cada capítulo termina con un ejercicio accionable",
      "La biblioteca incluye al menos 10 mensajes adaptados a LatAm",
      "El CSV trae columnas de etapa, fecha y próximo paso, con filas de ejemplo",
    ],
    viabilityScore: 62,
    risks: ["Mercado saturado de contenido gratuito"],
    assumptionsToValidate: ["Disposición a pagar US$19 por un kit en español"],
  };
}
