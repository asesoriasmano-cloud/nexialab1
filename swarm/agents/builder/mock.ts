import type { Brief, Manifest } from "../../src/schemas.ts";

/** Manifiesto simulado para --dry-run, derivado de los entregables del brief. */
export function mockManifest(brief: Brief): Manifest {
  let chapter = 0;
  return {
    productName: brief.productName,
    slug: "kit-simulado",
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
  "Antes de empezar, reúne en un solo lugar todos los documentos y datos que vas a necesitar. Quien avanza con un orden claro comete menos errores, ahorra tiempo y puede detectar a tiempo cualquier requisito pendiente, porque cada paso queda registrado con su fecha y su próxima acción en la hoja de control.";

/** Contenido simulado que cumple los chequeos determinísticos de QA. */
export function mockFileContent(f: Manifest["files"][number], iteration: number): string {
  if (f.kind === "csv") {
    const rows = [
      "item,responsable,categoria,estado,fecha,proximo_paso",
      ...Array.from({ length: 20 }, (_, i) => `Ítem ${i + 1},Persona ${i + 1},Documentación,${["pendiente", "en curso", "listo"][i % 3]},2026-11-${String((i % 28) + 1).padStart(2, "0")},"Revisar, día ${(i % 7) + 1}"`),
    ];
    return rows.join("\n");
  }
  const heading = f.kind === "guide_chapter" ? `## ${f.title}` : `# ${f.title}`;
  const body = Array.from({ length: 4 }, () => PARAGRAPH).join("\n\n");
  const revision = iteration > 0 ? "\n\n### Ejemplo aplicado\n\n" + PARAGRAPH : "";
  const exercise = f.kind === "guide_chapter" ? "\n\n### Ejercicio\n\nCompleta las tres primeras filas de la hoja de control con tu propio caso." : "";
  return `${heading}\n\n${body}${revision}${exercise}`;
}
