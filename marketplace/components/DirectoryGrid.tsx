import { BusinessCard } from "./BusinessCard";
import type { Business } from "@/lib/types";

type Props = {
  businesses: Business[];
  emptyMessage?: string;
};

export function DirectoryGrid({ businesses, emptyMessage }: Props) {
  if (businesses.length === 0) {
    return (
      <p className="border border-papel-borde bg-papel-hueco px-4 py-6 text-salvia-tinta">
        {emptyMessage ?? "No hay fichas que coincidan con esa consulta."}
      </p>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business, index) => (
        <li key={business.id} className="flex">
          {/* El sello se estampa una sola vez, en la primera fila. */}
          <BusinessCard business={business} stamp={index < 3} />
        </li>
      ))}
    </ul>
  );
}
