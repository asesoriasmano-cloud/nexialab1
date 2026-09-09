/** Helpers de presentación y de folio. Sin dependencias de servidor. */

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Folio secuencial de cuatro dígitos, tal como se ve en la cartilla. */
export function nextFolio(existing: string[]): string {
  const highest = existing.reduce((max, folio) => {
    const value = Number.parseInt(folio, 10);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return String(highest + 1).padStart(4, "0");
}

export function formatFolio(folio: string | null): string {
  return folio ? `N° ${folio}` : "Sin folio";
}

export function formatRating(rating: number | null): string | null {
  if (rating === null) return null;
  return rating.toFixed(1).replace(".", ",");
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(new Date(iso));
}

export function whatsappHref(number: string, message?: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${suffix}`;
}

export function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export const REGIONES_CHILE = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "Libertador General Bernardo O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y de la Antártica Chilena",
] as const;
