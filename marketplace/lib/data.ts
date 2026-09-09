import "server-only";

import { seedBusinesses, seedCategories, type SeedBusiness } from "@/prisma/seed-data";
import type { Prisma } from "./generated/prisma/client";
import { getPrisma, isDatabaseConfigured } from "./prisma";
import { nextFolio, slugify } from "./format";
import type {
  Business,
  Category,
  DirectoryFilters,
  PendingBusiness,
  Tier,
} from "./types";

export { isDatabaseConfigured };

/* -------------------------------------------------------------------------- */
/* Modo demo: los mismos datos del seed, servidos desde memoria.               */
/* -------------------------------------------------------------------------- */

function demoCategory(slug: string): Category {
  const found = seedCategories.find((c) => c.slug === slug);
  if (!found) throw new Error(`Categoría desconocida en el seed: ${slug}`);
  return { id: found.slug, name: found.name, slug: found.slug, icon: found.icon, position: found.position };
}

function fromSeed(seed: SeedBusiness, index: number): PendingBusiness {
  const category = demoCategory(seed.categorySlug);
  return {
    id: seed.slug,
    slug: seed.slug,
    name: seed.name,
    rut: seed.rut ?? null,
    tier: seed.tier,
    description: seed.description,
    differentiationTag: seed.differentiationTag ?? null,
    region: seed.region,
    comuna: seed.comuna,
    address: seed.address ?? null,
    lat: seed.lat ?? null,
    lng: seed.lng ?? null,
    phone: seed.phone ?? null,
    whatsapp: seed.whatsapp ?? null,
    email: seed.email ?? null,
    website: seed.website ?? null,
    instagram: seed.instagram ?? null,
    gmbRating: seed.gmbRating ?? null,
    gmbReviewCount: seed.gmbReviewCount ?? null,
    status: seed.status,
    source: seed.source,
    featured: seed.featured ?? false,
    folioNumber: seed.folioNumber ?? null,
    createdAt: new Date(Date.UTC(2026, 6, 1) + index * 86_400_000).toISOString(),
    category: { id: category.id, name: category.name, slug: category.slug },
    offers: (seed.offers ?? []).map((offer, i) => ({
      id: `${seed.slug}-offer-${i}`,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      priceRange: offer.priceRange ?? null,
      bookable: offer.bookable ?? false,
    })),
    media: [],
    ingestion: seed.ingestion
      ? {
          id: `${seed.slug}-log`,
          runId: seed.ingestion.runId,
          confidenceScore: seed.ingestion.confidenceScore,
          reviewerNotes: seed.ingestion.reviewerNotes ?? null,
          rawSourceData: seed.ingestion.raw,
        }
      : null,
  };
}

/**
 * El store del modo demo vive en el módulo, así que las aprobaciones y los
 * leads duran lo que dure el proceso. Es intencional: sirve para probar el
 * flujo completo sin base de datos, no para guardar nada.
 */
const demoStore: PendingBusiness[] = seedBusinesses.map(fromSeed);

function matchesFilters(business: Business, filters: DirectoryFilters): boolean {
  if (filters.categorySlug && business.category.slug !== filters.categorySlug) return false;
  if (filters.region && business.region !== filters.region) return false;
  if (filters.tier && business.tier !== filters.tier) return false;
  if (filters.query) {
    const haystack = [
      business.name,
      business.description,
      business.differentiationTag ?? "",
      business.comuna,
      business.region,
      business.category.name,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.query.trim().toLowerCase())) return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* Selección compartida para las consultas de Prisma                          */
/* -------------------------------------------------------------------------- */

const businessInclude = {
  category: { select: { id: true, name: true, slug: true } },
  offers: { orderBy: { position: "asc" } },
  media: { orderBy: { position: "asc" } },
} satisfies Prisma.BusinessInclude;

type PrismaBusinessRow = Prisma.BusinessGetPayload<{ include: typeof businessInclude }>;

function fromRow(row: PrismaBusinessRow): Business {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    rut: row.rut,
    tier: row.tier,
    description: row.description,
    differentiationTag: row.differentiationTag,
    region: row.region,
    comuna: row.comuna,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    instagram: row.instagram,
    gmbRating: row.gmbRating,
    gmbReviewCount: row.gmbReviewCount,
    status: row.status,
    source: row.source,
    featured: row.featured,
    folioNumber: row.folioNumber,
    createdAt: row.createdAt.toISOString(),
    category: row.category,
    offers: row.offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      priceRange: offer.priceRange,
      bookable: offer.bookable,
    })),
    media: row.media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      alt: item.alt,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Lecturas                                                                    */
/* -------------------------------------------------------------------------- */

export async function getCategories(): Promise<Category[]> {
  if (!isDatabaseConfigured) {
    return seedCategories
      .map((category) => ({
        id: category.slug,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        position: category.position,
        businessCount: demoStore.filter(
          (b) => b.status === "approved" && b.category.slug === category.slug,
        ).length,
      }))
      .sort((a, b) => a.position - b.position);
  }

  const rows = await getPrisma().category.findMany({
    where: { parentId: null },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { businesses: { where: { status: "approved" } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    position: row.position,
    businessCount: row._count.businesses,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function listBusinesses(filters: DirectoryFilters = {}): Promise<Business[]> {
  if (!isDatabaseConfigured) {
    return demoStore
      .filter((business) => business.status === "approved" && matchesFilters(business, filters))
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          (a.folioNumber ?? "9999").localeCompare(b.folioNumber ?? "9999"),
      );
  }

  const query = filters.query?.trim();
  const rows = await getPrisma().business.findMany({
    where: {
      status: "approved",
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.region ? { region: filters.region } : {}),
      ...(filters.tier ? { tier: filters.tier } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
              { differentiationTag: { contains: query, mode: "insensitive" as const } },
              { comuna: { contains: query, mode: "insensitive" as const } },
              { region: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: businessInclude,
    orderBy: [{ featured: "desc" }, { folioNumber: "asc" }],
  });

  return rows.map(fromRow);
}

export async function getFeaturedBusinesses(limit = 3): Promise<Business[]> {
  const all = await listBusinesses();
  return all.filter((business) => business.featured).slice(0, limit);
}

export async function getBusinessBySlug(
  categorySlug: string,
  slug: string,
): Promise<Business | null> {
  if (!isDatabaseConfigured) {
    return (
      demoStore.find(
        (business) =>
          business.slug === slug &&
          business.category.slug === categorySlug &&
          business.status === "approved",
      ) ?? null
    );
  }

  const row = await getPrisma().business.findFirst({
    where: { slug, status: "approved", category: { slug: categorySlug } },
    include: businessInclude,
  });

  return row ? fromRow(row) : null;
}

export async function listApprovedRoutes(): Promise<Array<{ categoria: string; slug: string }>> {
  const businesses = await listBusinesses();
  return businesses.map((business) => ({
    categoria: business.category.slug,
    slug: business.slug,
  }));
}

export async function getRegions(): Promise<string[]> {
  const businesses = await listBusinesses();
  return [...new Set(businesses.map((business) => business.region))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

export async function getPendingBusinesses(): Promise<PendingBusiness[]> {
  if (!isDatabaseConfigured) {
    return demoStore.filter((business) => business.status === "pending");
  }

  const rows = await getPrisma().business.findMany({
    where: { status: "pending" },
    include: {
      ...businessInclude,
      ingestionLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => {
    const log = row.ingestionLogs[0];
    return {
      ...fromRow(row),
      ingestion: log
        ? {
            id: log.id,
            runId: log.runId,
            confidenceScore: log.confidenceScore,
            reviewerNotes: log.reviewerNotes,
            rawSourceData: (log.rawSourceData ?? {}) as Record<string, unknown>,
          }
        : null,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Escrituras                                                                  */
/* -------------------------------------------------------------------------- */

export type LeadInput = {
  businessId: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  message: string;
};

export async function createLead(input: LeadInput): Promise<void> {
  if (!isDatabaseConfigured) {
    // En modo demo no hay dónde guardar el lead; se deja constancia en el log
    // del servidor para poder verificar el flujo del formulario.
    console.info("[demo] lead recibido", input);
    return;
  }

  await getPrisma().lead.create({
    data: {
      businessId: input.businessId,
      contactName: input.contactName,
      contactPhone: input.contactPhone || null,
      contactEmail: input.contactEmail || null,
      message: input.message,
    },
  });
}

export type SignupInput = {
  name: string;
  categorySlug: string;
  tier: Tier;
  description: string;
  differentiationTag?: string;
  region: string;
  comuna: string;
  rut?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
};

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  if (!isDatabaseConfigured) {
    let candidate = root;
    let n = 2;
    while (demoStore.some((business) => business.slug === candidate)) {
      candidate = `${root}-${n++}`;
    }
    return candidate;
  }

  const taken = await getPrisma().business.findMany({
    where: { slug: { startsWith: root } },
    select: { slug: true },
  });
  const set = new Set(taken.map((row) => row.slug));
  if (!set.has(root)) return root;
  let n = 2;
  while (set.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

export async function createSelfSignup(input: SignupInput): Promise<{ slug: string }> {
  const slug = await uniqueSlug(input.name);

  if (!isDatabaseConfigured) {
    const category = demoCategory(input.categorySlug);
    demoStore.push({
      id: slug,
      slug,
      name: input.name,
      rut: input.rut ?? null,
      tier: input.tier,
      description: input.description,
      differentiationTag: input.differentiationTag ?? null,
      region: input.region,
      comuna: input.comuna,
      address: null,
      lat: null,
      lng: null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      instagram: input.instagram ?? null,
      gmbRating: null,
      gmbReviewCount: null,
      status: "pending",
      source: "self_signup",
      featured: false,
      folioNumber: null,
      createdAt: new Date().toISOString(),
      category: { id: category.id, name: category.name, slug: category.slug },
      offers: [],
      media: [],
      ingestion: {
        id: `${slug}-log`,
        runId: "autopostulacion",
        confidenceScore: 0.5,
        reviewerNotes: null,
        rawSourceData: { fuente: "formulario_sumar_negocio", declarado_por: "titular" },
      },
    });
    return { slug };
  }

  const prisma = getPrisma();
  const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
  if (!category) throw new Error("Categoría no encontrada");

  await prisma.business.create({
    data: {
      slug,
      name: input.name,
      rut: input.rut || null,
      categoryId: category.id,
      tier: input.tier,
      description: input.description,
      differentiationTag: input.differentiationTag || null,
      region: input.region,
      comuna: input.comuna,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      website: input.website || null,
      instagram: input.instagram || null,
      status: "pending",
      source: "self_signup",
      ingestionLogs: {
        create: {
          runId: "autopostulacion",
          confidenceScore: 0.5,
          rawSourceData: { fuente: "formulario_sumar_negocio", declarado_por: "titular" },
        },
      },
    },
  });

  return { slug };
}

export type ReviewDecisionInput = {
  businessId: string;
  decision: "approved" | "rejected";
  reviewer: string;
  notes?: string;
};

export async function decideBusiness(input: ReviewDecisionInput): Promise<void> {
  if (!isDatabaseConfigured) {
    const business = demoStore.find((item) => item.id === input.businessId);
    if (!business) throw new Error("Negocio no encontrado");
    business.status = input.decision;
    if (business.ingestion && input.notes) business.ingestion.reviewerNotes = input.notes;
    if (input.decision === "approved" && !business.folioNumber) {
      business.folioNumber = nextFolio(
        demoStore.map((item) => item.folioNumber).filter((folio): folio is string => folio !== null),
      );
    }
    return;
  }

  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const current = await tx.business.findUnique({
      where: { id: input.businessId },
      select: { folioNumber: true },
    });
    if (!current) throw new Error("Negocio no encontrado");

    let folioNumber = current.folioNumber;
    if (input.decision === "approved" && !folioNumber) {
      const taken = await tx.business.findMany({
        where: { folioNumber: { not: null } },
        select: { folioNumber: true },
      });
      folioNumber = nextFolio(
        taken.map((row) => row.folioNumber).filter((folio): folio is string => folio !== null),
      );
    }

    await tx.business.update({
      where: { id: input.businessId },
      data: {
        status: input.decision,
        folioNumber,
        approvedAt: input.decision === "approved" ? new Date() : null,
        approvedBy: input.decision === "approved" ? input.reviewer : null,
      },
    });

    await tx.ingestionLog.updateMany({
      where: { businessId: input.businessId },
      data: {
        decision: input.decision,
        decidedAt: new Date(),
        ...(input.notes ? { reviewerNotes: input.notes } : {}),
      },
    });
  });
}
