import { CategoryTabs } from "@/components/CategoryTabs";
import { DirectoryGrid } from "@/components/DirectoryGrid";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/SectionHeading";
import { getCategories, getRegions, isDatabaseConfigured, listBusinesses } from "@/lib/data";
import type { Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; region?: string; tier?: string }>;

function parseTier(value: string | undefined): Tier | undefined {
  return value === "empresa" || value === "emprendimiento" ? value : undefined;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tier = parseTier(params.tier);
  const hayConsulta = Boolean(params.q || params.region || tier);

  const [categories, regions, resultados] = await Promise.all([
    getCategories(),
    getRegions(),
    listBusinesses({ query: params.q, region: params.region, tier }),
  ]);

  const verificadas = resultados.filter((business) => business.tier === "empresa");
  const emprendimientos = resultados.filter((business) => business.tier === "emprendimiento");
  const destacados = resultados.filter((business) => business.featured);

  return (
    <>
      <section className="papel-pautado border-b border-papel-borde">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="rotulo">Catastro del rubro pet y veterinario en Chile</p>
          <h1 className="folio-type mt-2 max-w-3xl text-4xl leading-[1.1] text-tinta sm:text-5xl">
            Un registro donde estar inscrito significa algo.
          </h1>
          <p className="texto-medida mt-4 text-lg text-negro/85">
            Cada ficha se revisa a mano antes de recibir folio. Las empresas verificadas llevan
            sello; los emprendimientos entran con su diferenciación declarada.
          </p>

          <div className="mt-8 max-w-4xl border border-papel-borde bg-papel p-4 sm:p-5">
            <SearchBar
              action="/"
              regions={regions}
              defaultQuery={params.q}
              defaultRegion={params.region}
              defaultTier={tier}
            />
          </div>

          {!isDatabaseConfigured ? (
            <p className="mt-5 max-w-2xl border-l-4 border-sello bg-papel-hueco px-3 py-2 text-sm text-negro">
              Modo demo: sin <code className="folio-type">DATABASE_URL</code>, la app sirve los
              datos ficticios de <code className="folio-type">prisma/seed-data.ts</code>. Las
              aprobaciones y los leads no se guardan.
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <CategoryTabs categories={categories} active={null} />
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {hayConsulta ? (
          <section>
            <SectionHeading
              rotulo={`${resultados.length} ${resultados.length === 1 ? "ficha" : "fichas"} en el resultado`}
              titulo="Resultado de la consulta"
              bajada="Se muestran solo fichas aprobadas y con folio asignado."
            />
            <div className="mt-6">
              <DirectoryGrid businesses={resultados} />
            </div>
          </section>
        ) : (
          <>
            {destacados.length > 0 ? (
              <section>
                <SectionHeading
                  rotulo="Carril destacado"
                  titulo="Fichas destacadas del mes"
                  bajada="Negocios con destaque vigente en el registro."
                />
                <div className="mt-6">
                  <DirectoryGrid businesses={destacados} />
                </div>
              </section>
            ) : null}

            <section>
              <SectionHeading
                rotulo={`${verificadas.length} inscritas`}
                titulo="Empresas verificadas"
                bajada="Razón social comprobada, datos de contacto validados y sello estampado en la cartilla."
              />
              <div className="mt-6">
                <DirectoryGrid businesses={verificadas} />
              </div>
            </section>

            <section>
              <SectionHeading
                rotulo={`${emprendimientos.length} inscritos`}
                titulo="Emprendimientos con diferenciación"
                bajada="Entran al registro por lo que hacen distinto, no por tamaño."
              />
              <div className="mt-6">
                <DirectoryGrid businesses={emprendimientos} />
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
