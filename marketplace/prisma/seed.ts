import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import { seedBusinesses, seedCategories } from "./seed-data";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("Define DATABASE_URL antes de correr el seed.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const category of seedCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon, position: category.position },
      create: {
        slug: category.slug,
        name: category.name,
        icon: category.icon,
        position: category.position,
      },
    });
  }
  console.log(`Categorías listas: ${seedCategories.length}`);

  for (const business of seedBusinesses) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: business.categorySlug },
    });

    const data = {
      name: business.name,
      rut: business.rut ?? null,
      categoryId: category.id,
      tier: business.tier,
      description: business.description,
      differentiationTag: business.differentiationTag ?? null,
      region: business.region,
      comuna: business.comuna,
      address: business.address ?? null,
      lat: business.lat ?? null,
      lng: business.lng ?? null,
      phone: business.phone ?? null,
      whatsapp: business.whatsapp ?? null,
      email: business.email ?? null,
      website: business.website ?? null,
      instagram: business.instagram ?? null,
      gmbPlaceId: business.gmbPlaceId ?? null,
      gmbRating: business.gmbRating ?? null,
      gmbReviewCount: business.gmbReviewCount ?? null,
      status: business.status,
      source: business.source,
      featured: business.featured ?? false,
      folioNumber: business.folioNumber ?? null,
      approvedAt: business.status === "approved" ? new Date() : null,
      approvedBy: business.status === "approved" ? "seed@registro.cl" : null,
    };

    const saved = await prisma.business.upsert({
      where: { slug: business.slug },
      update: data,
      create: { slug: business.slug, ...data },
    });

    // El seed es idempotente: se reemplazan las ofertas y el log de ingesta
    // en vez de acumular duplicados en cada corrida.
    await prisma.offer.deleteMany({ where: { businessId: saved.id } });
    if (business.offers?.length) {
      await prisma.offer.createMany({
        data: business.offers.map((offer, index) => ({
          businessId: saved.id,
          title: offer.title,
          description: offer.description,
          type: offer.type,
          priceRange: offer.priceRange ?? null,
          bookable: offer.bookable ?? false,
          position: index,
        })),
      });
    }

    await prisma.ingestionLog.deleteMany({ where: { businessId: saved.id } });
    if (business.ingestion) {
      await prisma.ingestionLog.create({
        data: {
          businessId: saved.id,
          runId: business.ingestion.runId,
          confidenceScore: business.ingestion.confidenceScore,
          reviewerNotes: business.ingestion.reviewerNotes ?? null,
          rawSourceData: business.ingestion.raw,
          decision: business.status === "pending" ? "pending" : business.status,
          decidedAt: business.status === "pending" ? null : new Date(),
        },
      });
    }
  }

  console.log(`Negocios listos: ${seedBusinesses.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
