import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Solo lo usan los comandos de CLI (migrate, db push, studio).
    // En runtime la conexion va por el adapter en lib/prisma.ts.
    // Se deja vacio en modo demo: los comandos de CLI son los unicos que
    // lo necesitan y fallan con un mensaje claro si falta.
    url: process.env.DATABASE_URL ?? "",
  },
});
