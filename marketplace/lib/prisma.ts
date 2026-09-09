import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

/**
 * La app corre en dos modos:
 *
 *   - conectada: hay DATABASE_URL y todo pasa por Postgres.
 *   - demo: no hay DATABASE_URL y `lib/data.ts` sirve los datos de
 *     `prisma/seed-data.ts` en memoria. Es lo que permite validar el diseño
 *     de las cartillas (fase 2 del spec) antes de levantar la base.
 */
export const databaseUrl = process.env.DATABASE_URL?.trim() || null;
export const isDatabaseConfigured = databaseUrl !== null;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

export function getPrisma(): PrismaClient {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL no está definida. La app está corriendo en modo demo; " +
        "define DATABASE_URL para usar Postgres.",
    );
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient(databaseUrl);
  }
  return globalForPrisma.prisma;
}
