import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FolioBadge } from "@/components/FolioBadge";
import { LeadForm } from "@/components/LeadForm";
import { getBusinessBySlug } from "@/lib/data";
import { formatDate, formatRating, websiteLabel, whatsappHref } from "@/lib/format";
import type { Business } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ categoria: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categoria, slug } = await params;
  const business = await getBusinessBySlug(categoria, slug);
  if (!business) return { title: "Ficha no encontrada" };
  return {
    title: business.name,
    description: business.description.slice(0, 155),
  };
}

/** Fila de la tabla de identificacion, con rotulo a la izquierda. */
function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="regla-campo grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 text-[0.9375rem] sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="rotulo pt-0.5">{rotulo}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Contacto({ business }: { business: Business }) {
  const items: Array<{ rotulo: string; node: React.ReactNode }> = [];

  if (business.phone) {
    items.push({
      rotulo: "Teléfono",
      node: (
        <a href={`tel:${business.phone.replace(/[^0-9+]/g, "")}`} className="hover:text-sello hover:underline">
          {business.phone}
        </a>
      ),
    });
  }
  if (business.whatsapp) {
    items.push({
      rotulo: "WhatsApp",
      node: (
        <a
          href={whatsappHref(business.whatsapp, `Hola ${business.name}, los encontré en el Registro Pet/Vet.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sello hover:underline"
        >
          {business.whatsapp}
        </a>
      ),
    });
  }
  if (business.email) {
    items.push({
      rotulo: "Correo",
      node: (
        <a href={`mailto:${business.email}`} className="hover:text-sello hover:underline">
          {business.email}
        </a>
      ),
    });
  }
  if (business.website) {
    items.push({
      rotulo: "Sitio web",
      node: (
        <a
          href={business.website}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sello hover:underline"
        >
          {websiteLabel(business.website)}
        </a>
      ),
    });
  }
  if (business.instagram) {
    items.push({
      rotulo: "Instagram",
      node: (
        <a
          href={`https://instagram.com/${business.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sello hover:underline"
        >
          @{business.instagram}
        </a>
      ),
    });
  }

  if (items.length === 0) {
    return <p className="text-salvia-tinta">Sin canales de contacto públicos declarados.</p>;
  }

  return (
    <dl>
      {items.map((item) => (
        <Campo key={item.rotulo} rotulo={item.rotulo}>
          {item.node}
        </Campo>
      ))}
    </dl>
  );
}

export default async function BusinessPage({ params }: { params: Params }) {
  const { categoria, slug } = await params;
  const business = await getBusinessBySlug(categoria, slug);
  if (!business) notFound();

  const rating = formatRating(business.gmbRating);
  const esEmpresa = business.tier === "empresa";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Ruta" className="text-sm text-salvia-tinta">
        <Link href="/" className="hover:text-sello hover:underline">
          Registro
        </Link>
        <span className="divisor-vertical" />
        <Link href={`/${business.category.slug}`} className="hover:text-sello hover:underline">
          {business.category.name}
        </Link>
      </nav>

      <article
        className={`cartilla mt-4 p-5 sm:p-8 ${esEmpresa ? "" : "cartilla--emprendimiento"}`}
      >
        <header className="regla-doble flex flex-wrap items-start justify-between gap-4 pb-5">
          <div>
            <p className="rotulo">
              {esEmpresa ? "Carril de empresas verificadas" : "Carril de emprendimientos"}
            </p>
            <h1 className="folio-type mt-1 text-3xl leading-tight text-tinta sm:text-4xl">
              {business.name}
            </h1>
            <p className="mt-2 text-salvia-tinta">
              <span>{business.category.name}</span>
              <span className="divisor-vertical" />
              <span>
                {business.comuna}, {business.region}
              </span>
            </p>
          </div>

          <FolioBadge folio={business.folioNumber} tier={business.tier} animate size="lg" />
        </header>

        <div className="grid gap-10 pt-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-8">
            <section>
              <h2 className="rotulo">Descripción del registro</h2>
              <p className="texto-medida mt-2 text-[1.0625rem] leading-relaxed">
                {business.description}
              </p>

              {business.differentiationTag ? (
                <p className="mt-4 border-l-2 border-sello bg-papel-hueco px-3 py-2">
                  <span className="rotulo block">Diferenciación declarada</span>
                  <span>{business.differentiationTag}</span>
                </p>
              ) : null}
            </section>

            {business.offers.length > 0 ? (
              <section>
                <h2 className="folio-type regla-campo pb-2 text-xl text-tinta">
                  Servicios y productos inscritos
                </h2>
                <ul className="mt-4 space-y-4">
                  {business.offers.map((offer) => (
                    <li key={offer.id} className="regla-campo pb-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-semibold text-tinta">{offer.title}</h3>
                        {offer.priceRange ? (
                          <p className="folio-type text-sello">{offer.priceRange}</p>
                        ) : null}
                      </div>
                      <p className="texto-medida mt-1 text-[0.9375rem] text-negro/85">
                        {offer.description}
                      </p>
                      <p className="rotulo mt-1">
                        {offer.type === "servicio" ? "Servicio" : "Producto"}
                        {offer.bookable ? (
                          <>
                            <span className="divisor-vertical" />
                            <span className="text-tinta">Reservable en línea</span>
                          </>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="folio-type regla-campo pb-2 text-xl text-tinta">
                Datos de identificación
              </h2>
              <dl className="mt-3">
                <Campo rotulo="Folio">{business.folioNumber ?? "Sin asignar"}</Campo>
                {business.rut ? <Campo rotulo="RUT">{business.rut}</Campo> : null}
                <Campo rotulo="Categoría">{business.category.name}</Campo>
                <Campo rotulo="Región">{business.region}</Campo>
                <Campo rotulo="Comuna">{business.comuna}</Campo>
                {business.address ? <Campo rotulo="Dirección">{business.address}</Campo> : null}
                {rating ? (
                  <Campo rotulo="Reseñas Google">
                    {rating} de 5
                    {business.gmbReviewCount ? ` sobre ${business.gmbReviewCount} reseñas` : ""}
                  </Campo>
                ) : null}
                <Campo rotulo="Ingreso al registro">{formatDate(business.createdAt)}</Campo>
              </dl>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="border border-papel-borde bg-papel-hueco p-4">
              <h2 className="folio-type regla-campo pb-2 text-lg text-tinta">Contacto directo</h2>
              <div className="mt-2">
                <Contacto business={business} />
              </div>
            </section>

            <section className="border border-papel-borde p-4">
              <h2 className="folio-type regla-campo pb-2 text-lg text-tinta">
                Consultar a este negocio
              </h2>
              <p className="mt-2 mb-4 text-sm text-salvia-tinta">
                La consulta queda registrada y llega con tus datos de contacto.
              </p>
              <LeadForm businessId={business.id} businessName={business.name} />
            </section>
          </aside>
        </div>
      </article>
    </div>
  );
}
