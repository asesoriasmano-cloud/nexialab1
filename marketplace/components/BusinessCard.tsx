import Link from "next/link";

import { FolioBadge } from "./FolioBadge";
import { formatRating } from "@/lib/format";
import type { Business } from "@/lib/types";

type Props = {
  business: Business;
  /** El sello se estampa solo en la primera fila visible, no en toda la grilla. */
  stamp?: boolean;
};

/**
 * La cartilla del directorio. Dos variantes segun el carril de oferta:
 *
 *   tier=empresa         -> regla superior en tinta + sello de verificacion
 *   tier=emprendimiento  -> borde de recorte lateral + etiqueta de diferenciacion
 *
 * Todo el contenido va alineado a la izquierda, como un formulario.
 */
export function BusinessCard({ business, stamp = false }: Props) {
  const rating = formatRating(business.gmbRating);
  const esEmpresa = business.tier === "empresa";

  return (
    <article
      className={[
        "cartilla flex h-full flex-col p-5",
        esEmpresa ? "" : "cartilla--emprendimiento",
        business.featured ? "cartilla--destacada" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="regla-campo pb-3">
        <FolioBadge folio={business.folioNumber} tier={business.tier} animate={stamp} spread />
      </header>

      <div className="pt-3">
        <h3 className="folio-type text-xl leading-snug text-tinta">
          <Link
            href={`/${business.category.slug}/${business.slug}`}
            className="hover:text-sello hover:underline hover:decoration-1 hover:underline-offset-4"
          >
            {business.name}
          </Link>
        </h3>

        <p className="mt-1 text-sm text-salvia-tinta">
          <span>{business.category.name}</span>
          <span className="divisor-vertical" />
          <span>
            {business.comuna}, {business.region}
          </span>
        </p>
      </div>

      <p className="texto-medida mt-3 line-clamp-3 text-[0.9375rem] text-negro/85">
        {business.description}
      </p>

      {business.differentiationTag ? (
        <p className="mt-4 border-l-2 border-salvia bg-papel-hueco px-3 py-2 text-sm text-salvia-tinta">
          <span className="rotulo block">Diferenciación declarada</span>
          <span className="text-negro">{business.differentiationTag}</span>
        </p>
      ) : null}

      <dl className="regla-doble mt-auto grid grid-cols-2 gap-x-4 gap-y-1 pt-4 text-sm">
        <div>
          <dt className="rotulo">Carril</dt>
          <dd>{esEmpresa ? "Empresa verificada" : "Emprendimiento"}</dd>
        </div>
        {rating ? (
          <div>
            <dt className="rotulo">Reseñas Google</dt>
            <dd>
              {rating} de 5
              {business.gmbReviewCount ? (
                <span className="text-salvia-tinta"> ({business.gmbReviewCount})</span>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      <Link
        href={`/${business.category.slug}/${business.slug}`}
        className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-tinta hover:text-sello"
      >
        Ver cartilla completa
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </article>
  );
}
