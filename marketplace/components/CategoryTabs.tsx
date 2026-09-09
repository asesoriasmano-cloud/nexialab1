import Link from "next/link";

import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  /** slug de la categoria activa, o null para la pestana "Todo el registro". */
  active: string | null;
};

/** Pestanas de carpeta, no chips. La activa "abre" la carpeta hacia el contenido. */
export function CategoryTabs({ categories, active }: Props) {
  return (
    <nav aria-label="Categorías del registro" className="carpeta overflow-x-auto">
      <ul className="flex min-w-max items-end">
        <li>
          <Link href="/" className="pestana" aria-current={active === null ? "page" : undefined}>
            Todo el registro
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/${category.slug}`}
              className="pestana"
              aria-current={active === category.slug ? "page" : undefined}
            >
              {category.name}
              {typeof category.businessCount === "number" ? (
                <span className="folio-type text-xs text-salvia-tinta">
                  {category.businessCount}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
