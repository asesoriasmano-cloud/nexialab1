import type { Brief, Manifest } from "../../src/schemas.ts";

/** Manifiesto simulado para --dry-run, derivado de los entregables del brief. */
export function mockManifest(brief: Brief): Manifest {
  let chapter = 0;
  return {
    productName: brief.productName,
    slug: "kit-sdr-express",
    guideTitle: `${brief.productName}: guía de implementación`,
    files: brief.mvp.deliverables.map((d) => {
      const base = d.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
      const path =
        d.kind === "guide_chapter"
          ? `guia/${String(++chapter).padStart(2, "0")}-${base}.md`
          : d.kind === "csv"
            ? `plantillas/${base}.csv`
            : `plantillas/${base}.md`;
      return { path, kind: d.kind, title: d.name, purpose: d.description, targetWords: 120 };
    }),
  };
}

const PARAGRAPH =
  "Define con precisión a quién le escribes antes de redactar cualquier mensaje. Una pyme de servicios gana más reuniones cuando conecta un dolor concreto con una prueba breve de que puede resolverlo, y cuando cada contacto tiene un próximo paso claro y fechado en su registro de seguimiento.";

/** Contenido simulado que cumple los chequeos determinísticos de QA. */
export function mockFileContent(f: Manifest["files"][number], iteration: number): string {
  if (f.kind === "csv") {
    const rows = [
      "empresa,contacto,cargo,etapa,fecha_ultimo_contacto,proximo_paso",
      ...Array.from({ length: 20 }, (_, i) => `Empresa ${i + 1},Persona ${i + 1},Gerente General,${["conexion", "conversacion", "reunion"][i % 3]},2026-11-${String((i % 28) + 1).padStart(2, "0")},"Enviar seguimiento, día ${(i % 7) + 1}"`),
    ];
    return rows.join("\n");
  }
  const heading = f.kind === "guide_chapter" ? `## ${f.title}` : `# ${f.title}`;
  const body = Array.from({ length: 4 }, () => PARAGRAPH).join("\n\n");
  const revision = iteration > 0 ? "\n\n### Ejemplo aplicado\n\n" + PARAGRAPH : "";
  const exercise = f.kind === "guide_chapter" ? "\n\n### Ejercicio\n\nEscribe tres mensajes de conexión para tu cliente ideal y regístralos en el CRM." : "";
  return `${heading}\n\n${body}${revision}${exercise}`;
}
