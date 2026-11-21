import type { Brief, Opportunities } from "../../src/schemas.ts";

/** Exploración simulada para --dry-run: oportunidades diversas en mercados y segmentos distintos. */
export function mockOpportunities(attempt: number): Opportunities {
  const c = (
    id: number,
    name: string,
    market: string,
    language: "es" | "en" | "pt",
    segment: string,
    score: number,
  ): Opportunities["candidates"][number] => ({
    id,
    name,
    market,
    language,
    country: { "España": "es", "Estados Unidos": "us", "Brasil": "br", "México": "mx", "Reino Unido": "gb", "Argentina": "ar", "Colombia": "co" }[market] ?? "",
    segment,
    problem: `Problema simulado de ${segment}`,
    productIdea: `Kit simulado: ${name}`,
    whyNow: "Simulado: sin datos en vivo",
    demandEvidence: "Simulado: sin datos en vivo",
    confidence: "baja",
    competition: score > 70 ? "baja" : "media",
    willingnessToPay: score > 65 ? "alta" : "media",
    buildability: "alta",
    distributionPath: "Comunidades y grupos del segmento + SEO de cola larga",
    queries: [name.toLowerCase().split(" ").slice(0, 3).join(" ")],
    score,
  });
  return {
    candidates: [
      c(1, "Kit del propietario que alquila sin inmobiliaria", "España", "es", "Arriendos entre particulares", 78),
      c(2, "Starter kit for independent dog walkers", "Estados Unidos", "en", "Oficios de cuidado de mascotas", 74),
      c(3, "Kit de documentos para emigrar a Canadá con visa de trabajo", "LatAm → Canadá", "es", "Migración", 71),
      c(4, "Planilha e guia de precificação para confeiteiras", "Brasil", "pt", "Gastronomía casera", 69),
      c(5, "Kit administrativo para condominios pequeños", "México", "es", "Administración de condominios", 66),
      c(6, "Checklist de cuidados para quien cuida a un padre con demencia", "LatAm hispano", "es", "Cuidadores familiares", 63),
      c(7, "Plantillas de operación para talleres mecánicos", "Chile y Perú", "es", "Oficios técnicos", 60),
      c(8, "Wedding budget planner for small weddings", "Reino Unido", "en", "Bodas", 55),
      c(9, "Guía de impuestos para freelancers que cobran en dólares", "Argentina", "es", "Freelancers", 52),
      c(10, "Kit de planificación de clases para profesores particulares", "Colombia", "es", "Educación", 50),
    ],
    selectedId: attempt > 0 ? 3 : 1,
    selectionRationale: "Simulado: mayor score combinando dolor urgente, poca oferta en español y distribución viable.",
  };
}

/** Brief simulado para --dry-run (coherente con la oportunidad elegida en mockOpportunities). */
export function mockBrief(attempt: number): Brief {
  const v2 = attempt > 0;
  return {
    opportunityId: v2 ? 3 : 1,
    selectionRationale: "Simulado: mejor combinación de señal real, disposición a pagar y facilidad de construcción.",
    productName: v2 ? "Kit Visa Canadá (simulado)" : "Kit Alquiler Directo (simulado)",
    oneLiner: v2
      ? "Todos los documentos y pasos para postular a una visa de trabajo en Canadá, en orden y en español."
      : "Alquila tu piso sin inmobiliaria: contrato, selección de inquilinos y cobros bajo control.",
    niche: v2 ? "Migración laboral LatAm → Canadá" : "Propietarios particulares que alquilan 1–3 viviendas",
    market: v2 ? "LatAm → Canadá" : "España",
    language: "es",
    targetAudience: {
      persona: v2
        ? "Profesional latinoamericano de 25–40 años que quiere emigrar a Canadá y no sabe por dónde empezar."
        : "Persona que heredó o compró un piso y lo alquila por su cuenta para ahorrarse la comisión de la inmobiliaria.",
      pains: ["Miedo a cometer errores costosos", "Información dispersa y contradictoria", "No sabe qué documentos necesita"],
      jobsToBeDone: ["Completar el proceso sin pagar asesorías caras", "Tener todo ordenado en un solo lugar"],
    },
    demandSignals: [{ signal: "Preguntas recurrentes en foros y grupos", evidence: "Simulado: sin datos en vivo", confidence: "baja" }],
    keywords: [
      { term: v2 ? "requisitos visa trabajo canadá" : "contrato alquiler particular", intent: "informacional", priority: "alta" },
      { term: v2 ? "checklist documentos canadá" : "plantilla contrato arrendamiento", intent: "comercial", priority: "alta" },
    ],
    competitors: [{ name: "Recursos gratuitos dispersos", offer: "Artículos sueltos", price: "Gratis", weakness: "Sin sistema ni plantillas" }],
    gap: "No hay un kit práctico, ordenado y en español que lleve paso a paso de principio a fin.",
    mvp: {
      format: "Guía PDF + plantillas Markdown + hoja de control en CSV",
      deliverables: [
        { name: "Fundamentos y primeros pasos", kind: "guide_chapter", description: "Panorama y decisiones clave" },
        { name: "El proceso paso a paso", kind: "guide_chapter", description: "Secuencia con tiempos y errores comunes" },
        { name: "Seguimiento y control", kind: "guide_chapter", description: "Qué revisar y cuándo" },
        { name: "Plantillas listas para usar", kind: "template", description: "Documentos para copiar y completar" },
        { name: "Hoja de control", kind: "csv", description: "Seguimiento con columnas y filas de ejemplo" },
      ],
      outOfScope: ["Asesoría legal personalizada", "Video cursos"],
    },
    pricing: { currency: "USD", price: 19, rationale: "Ticket de impulso, muy por debajo de una asesoría profesional.", upsell: "Pack premium con plantillas adicionales" },
    acceptanceCriteria: [
      "Cada capítulo termina con un ejercicio accionable",
      "Las plantillas indican claramente qué campos completar",
      "El CSV trae columnas de estado, fecha y próximo paso, con filas de ejemplo",
      "Ninguna parte del kit promete ingresos, ahorros ni resultados garantizados",
    ],
    viabilityScore: 64,
    risks: ["Cambios normativos que desactualicen el contenido"],
    assumptionsToValidate: ["Disposición a pagar US$19 por un kit en español"],
  };
}
