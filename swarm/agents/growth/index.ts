import { config } from "../../src/config.ts";
import { complete } from "../../src/core/llm.ts";
import { escapeHtml } from "../../src/core/pdf.ts";
import type { Defect, Feedback } from "../../src/core/types.ts";
import { GrowthPackSchema, type Brief, type GrowthPack, type Manifest } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";

/**
 * Growth & Copy: brief + producto aprobado → marketing/
 *   growth.json (SEO, ficha, correos, RRSS) · landing.html · emails/*.md · social.md · listing.md
 */
export async function runGrowth(ctx: AgentContext, input: { brief: Brief; feedback: Feedback | null }): Promise<GrowthPack> {
  const { workspace, logger, task } = ctx;
  const manifest = workspace.readJson<Manifest>("product/manifest.json");
  const system = loadSystemPrompt("growth", { brand: config.launch.brandName, market: config.kit.market });
  const context = `# Brief aprobado\n\n${JSON.stringify(input.brief, null, 2)}\n\n# Manifiesto real del kit (lo único que puedes prometer)\n\n${JSON.stringify(manifest, null, 2)}`;

  const defects = input.feedback?.target === "growth" ? input.feedback.defects : [];
  const fileOf = (d: Defect) => (d.file ?? "").replace(/^marketing\//, "");
  const globalDefects = defects.filter((d) => !d.file);
  const firstRun = !workspace.exists("marketing/growth.json") || !workspace.exists("marketing/landing.html");
  const packDefects = [...defects.filter((d) => fileOf(d) === "growth.json"), ...globalDefects];
  const landingDefects = [...defects.filter((d) => fileOf(d) === "landing.html"), ...globalDefects];

  // ---------- paquete JSON ----------
  let pack: GrowthPack;
  if (firstRun || packDefects.length) {
    const previous = !firstRun ? workspace.read("marketing/growth.json") : null;
    const { data } = await complete(ctx, {
      agent: "growth",
      system,
      context,
      prompt: previous
        ? `Corrige el paquete de growth.\n\n## Versión actual\n${previous}\n\n${formatDefects(packDefects)}\n\nEntrega el JSON completo corregido.`
        : `Crea el paquete de growth (SEO, ficha de venta, 5 correos y al menos 8 piezas para RRSS). Precio: US$${input.brief.pricing.price}.`,
      schema: GrowthPackSchema,
      maxTokens: 32000,
      expectedOutputTokens: 9000,
      mock: () => mockPack(input.brief),
    });
    pack = data;
    workspace.writeJson("marketing/growth.json", pack);
    writeReadableExports(ctx, pack);
    logger.info("growth", task.id, `Paquete de growth listo (${pack.emails.length} correos, ${pack.social.length} piezas RRSS).`);
  } else {
    pack = workspace.readJson<GrowthPack>("marketing/growth.json");
  }

  // ---------- landing ----------
  if (firstRun || landingDefects.length) {
    const previous = !firstRun ? workspace.read("marketing/landing.html") : null;
    const { data: html } = await complete(ctx, {
      agent: "growth",
      system,
      context: `${context}\n\n# SEO y ficha aprobados\n\n${JSON.stringify({ seo: pack.seo, listing: pack.listing }, null, 2)}`,
      prompt: previous
        ? `Corrige la landing.\n\n## Versión actual\n${previous}\n\n${formatDefects(landingDefects)}\n\nEntrega el HTML completo corregido.`
        : `Crea la landing de conversión completa (HTML autocontenido). Precio: US$${input.brief.pricing.price}. CTA: href="{{CHECKOUT_URL}}".`,
      maxTokens: 32000,
      expectedOutputTokens: 9000,
      mock: () => mockLanding(input.brief, pack, manifest),
    });
    workspace.write("marketing/landing.html", html.trim().replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "") + "\n");
    logger.info("growth", task.id, "Landing generada: marketing/landing.html");
  }
  return pack;
}

function formatDefects(defects: Defect[]): string {
  return `## Defectos a corregir (veto de QA)\n${defects.map((d) => `- [${d.severity}] ${d.issue} → ${d.fix}`).join("\n")}`;
}

function writeReadableExports(ctx: AgentContext, pack: GrowthPack): void {
  const ws = ctx.workspace;
  ws.remove("marketing/emails");
  pack.emails.forEach((e, i) => {
    ws.write(
      `marketing/emails/${String(i + 1).padStart(2, "0")}-dia-${e.day}.md`,
      `---\nasunto: ${JSON.stringify(e.subject)}\npreheader: ${JSON.stringify(e.preview)}\ndia: ${e.day}\n---\n\n${e.body}\n`,
    );
  });
  ws.write(
    "marketing/social.md",
    `# Piezas para redes sociales\n\n${pack.social.map((s, i) => `## ${i + 1}. ${s.platform}\n\n**Gancho:** ${s.hook}\n\n${s.text}\n`).join("\n")}`,
  );
  ws.write(
    "marketing/listing.md",
    `# Ficha para la pasarela de pago\n\n**Nombre:** ${pack.listing.name}\n\n**Tagline:** ${pack.listing.tagline}\n\n**Precio:** US$${pack.listing.price}\n\n**Tags:** ${pack.listing.tags.join(", ")}\n\n## Descripción\n\n${pack.listing.description}\n\n## SEO\n\n- Título: ${pack.seo.title}\n- Meta description: ${pack.seo.metaDescription}\n- Slug: ${pack.seo.slug}\n- Keywords: ${pack.seo.keywords.join(", ")}\n`,
  );
}

// ---------- simulación para --dry-run ----------

function mockPack(brief: Brief): GrowthPack {
  return {
    seo: {
      title: "Kit de prospección en LinkedIn para pymes",
      metaDescription: "Mensajes, cadencia de 14 días y CRM en CSV para agendar reuniones B2B desde LinkedIn sin contratar un SDR.",
      slug: "kit-prospeccion-linkedin-pymes",
      keywords: brief.keywords.map((k) => k.term),
    },
    listing: {
      name: brief.productName,
      tagline: brief.oneLiner,
      description: brief.mvp.deliverables.map((d) => `- **${d.name}**: ${d.description}`).join("\n"),
      price: brief.pricing.price,
      tags: ["linkedin", "ventas b2b", "prospección", "pymes"],
    },
    emails: [0, 1, 3, 5, 7].map((day) => ({
      day,
      subject: `Día ${day}: un paso para tu prospección`,
      preview: "Una idea práctica en 2 minutos",
      body: "Hoy te comparto una técnica simple para iniciar conversaciones en LinkedIn sin sonar a vendedor.",
    })),
    social: Array.from({ length: 8 }, (_, i) => ({
      platform: (i % 2 === 0 ? "linkedin" : "instagram") as "linkedin" | "instagram",
      hook: `Error #${i + 1} al prospectar en LinkedIn`,
      text: "La mayoría envía un pitch en el primer mensaje. Prueba empezar con una observación concreta sobre su negocio.",
    })),
  };
}

function mockLanding(brief: Brief, pack: GrowthPack, manifest: Manifest): string {
  const items = manifest.files.map((f) => `<li>${escapeHtml(f.title)}</li>`).join("");
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pack.seo.title)}</title>
<meta name="description" content="${escapeHtml(pack.seo.metaDescription)}">
<meta property="og:title" content="${escapeHtml(pack.seo.title)}"><meta property="og:description" content="${escapeHtml(pack.seo.metaDescription)}">
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;color:#111;background:#fff}a.cta{display:inline-block;background:#0b5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none}</style>
</head><body>
<h1>${escapeHtml(brief.oneLiner)}</h1>
<p><a class="cta" href="{{CHECKOUT_URL}}">Comprar por US$${brief.pricing.price}</a></p>
<h2>Qué incluye</h2><ul>${items}</ul>
<p><a class="cta" href="{{CHECKOUT_URL}}">Obtener el kit · US$${brief.pricing.price}</a></p>
<footer>${escapeHtml(config.launch.brandName)}</footer>
</body></html>`;
}
