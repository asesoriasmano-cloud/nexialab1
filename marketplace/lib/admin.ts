import "server-only";

import { cookies } from "next/headers";

export const ADMIN_COOKIE = "registro_admin";

export type AdminAccess =
  | { allowed: true; mode: "token" | "desarrollo" }
  | { allowed: false; reason: "sin-token" | "no-configurado" };

/**
 * La cola de revision no es publica.
 *
 *   - con ADMIN_TOKEN definido: hay que presentarlo una vez y queda en cookie.
 *   - sin ADMIN_TOKEN en desarrollo: queda abierta, para poder probar el flujo.
 *   - sin ADMIN_TOKEN en produccion: queda cerrada, no abierta por omision.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const expected = process.env.ADMIN_TOKEN?.trim();

  if (!expected) {
    return process.env.NODE_ENV === "production"
      ? { allowed: false, reason: "no-configurado" }
      : { allowed: true, mode: "desarrollo" };
  }

  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === expected
    ? { allowed: true, mode: "token" }
    : { allowed: false, reason: "sin-token" };
}
