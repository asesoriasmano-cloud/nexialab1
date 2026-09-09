import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryTabs } from "@/components/CategoryTabs";
import { DirectoryGrid } from "@/components/DirectoryGrid";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/SectionHeading";
import { getCategories, getCategoryBySlug, getRegions, listBusinesses } from "@/lib/data";
import type { Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ categoria: string }>;
type SearchParams = Promise<{ q?: string; region?: string; tier?: string }>;

function parseTier(value: string | undefined): Tier | undefined {
  return value === "empresa" || value === "emprendimiento" ? value : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: category.name,
    description: `${category.name} inscritas en el registro pet/vet de Chile, con folio y revisión manual.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { categoria } = await params;
  const query = await searchParams;
  const tier = parseTier(query.tier);

  const [category, categories, regions] = await Promise.all([
    getCategoryBySlug(categoria),
    getCategories(),
    getRegions(),
  ]);

  if (!category) notFound();

  const businesses = await listBusinesses({
    categorySlug: categoria,
    query: query.q,
    region: query.region,
    tier,
  });

  const verificadas = businesses.filter((business) => business.tier === "empresa");
  const emprendimientos = businesses.filter((business) => business.tier === "emprendimiento");

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <CategoryTabs categories={categories} active={category.slug} />
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <header>
          <SectionHeading
            nivel={1}
            rotulo={`Sección ${String(category.position).padStart(2, "0")} del registro`}
            titulo={category.name}
            bajada={`${businesses.length} ${businesses.length === 1 ? "ficha inscrita" : "fichas inscritas"} con folio vigente.`}
          />
        </header>

        <div className="border border-papel-borde bg-papel-hueco p-4 sm:p-5">
          <SearchBar
            action={`/${category.slug}`}
            regions={regions}
            defaultQuery={query.q}
            defaultRegion={query.region}
            defaultTier={tier}
          />
        </div>

        {verificadas.length > 0 ? (
          <section>
            <SectionHeading
              rotulo={`${verificadas.length} inscritas`}
              titulo="Empresas verificadas"
            />
            <div className="mt-6">
              <DirectoryGrid businesses={verificadas} />
            </div>
          </section>
        ) : null}

        {emprendimientos.length > 0 ? (
          <section>
            <SectionHeading
              rotulo={`${emprendimientos.length} inscritos`}
              titulo="Emprendimientos con diferenciación"
            />
            <div className="mt-6">
              <DirectoryGrid businesses={emprendimientos} />
            </div>
          </section>
        ) : null}

        {businesses.length === 0 ? (
          <DirectoryGrid
            businesses={[]}
            emptyMessage="Todavía no hay fichas aprobadas en esta sección con esos filtros."
          />
        ) : null}
      </div>
    </>
  );
}
