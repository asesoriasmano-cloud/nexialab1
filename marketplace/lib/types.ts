/**
 * Tipos de dominio de la app. Son independientes del cliente de Prisma para
 * que las paginas se rendericen igual en modo demo (sin base de datos) que
 * conectadas a Postgres.
 */

export type Tier = "empresa" | "emprendimiento";
export type BusinessStatus = "pending" | "approved" | "rejected";
export type Source = "osint" | "manual" | "self_signup";
export type OfferType = "producto" | "servicio";
export type LeadStatus = "nuevo" | "contactado" | "cerrado";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
  businessCount?: number;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  type: OfferType;
  priceRange: string | null;
  bookable: boolean;
};

export type MediaItem = {
  id: string;
  type: "logo" | "foto" | "video";
  url: string;
  alt: string | null;
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  rut: string | null;
  tier: Tier;
  description: string;
  differentiationTag: string | null;
  region: string;
  comuna: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  gmbRating: number | null;
  gmbReviewCount: number | null;
  status: BusinessStatus;
  source: Source;
  featured: boolean;
  folioNumber: string | null;
  createdAt: string;
  category: Pick<Category, "id" | "name" | "slug">;
  offers: Offer[];
  media: MediaItem[];
};

export type PendingBusiness = Business & {
  ingestion: {
    id: string;
    runId: string;
    confidenceScore: number | null;
    reviewerNotes: string | null;
    rawSourceData: Record<string, unknown>;
  } | null;
};

export type DirectoryFilters = {
  categorySlug?: string;
  query?: string;
  region?: string;
  tier?: Tier;
};
