"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ADMIN_COOKIE, getAdminAccess } from "@/lib/admin";
import { createLead, createSelfSignup, decideBusiness } from "@/lib/data";
import { REGIONES_CHILE } from "@/lib/format";
import type { FormState } from "@/lib/form-state";

/** Rescata los valores de texto del formulario para poder repoblarlo. */
function keepValues(formData: FormData, omit: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$") && !omit.includes(key)) {
      out[key] = value;
    }
  }
  return out;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Lead desde la ficha de negocio                                             */
/* -------------------------------------------------------------------------- */

const leadSchema = z
  .object({
    businessId: z.string().min(1),
    contactName: z.string().trim().min(2, "Escribe tu nombre."),
    contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
    contactEmail: z.string().trim().email("Revisa el correo.").optional().or(z.literal("")),
    message: z.string().trim().min(10, "Cuéntale al negocio qué necesitas (mínimo 10 caracteres)."),
  })
  .refine((data) => Boolean(data.contactPhone || data.contactEmail), {
    message: "Deja al menos un teléfono o un correo para que puedan responderte.",
    path: ["contactPhone"],
  });

export async function submitLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = leadSchema.safeParse({
    businessId: formData.get("businessId"),
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Falta corregir algunos campos.",
      fieldErrors: fieldErrors(parsed.error),
      values: keepValues(formData),
    };
  }

  try {
    await createLead({
      businessId: parsed.data.businessId,
      contactName: parsed.data.contactName,
      contactPhone: parsed.data.contactPhone || undefined,
      contactEmail: parsed.data.contactEmail || undefined,
      message: parsed.data.message,
    });
  } catch (error) {
    console.error("No se pudo guardar el lead", error);
    return {
      ok: false,
      message: "No pudimos enviar tu consulta. Inténtalo de nuevo.",
      values: keepValues(formData),
    };
  }

  return { ok: true, message: "Consulta enviada. El negocio la recibe con tus datos de contacto." };
}

/* -------------------------------------------------------------------------- */
/* Autopostulacion en /sumar-negocio                                          */
/* -------------------------------------------------------------------------- */

const signupSchema = z.object({
  name: z.string().trim().min(3, "Escribe el nombre del negocio."),
  categorySlug: z.string().trim().min(1, "Elige una categoría."),
  tier: z.enum(["empresa", "emprendimiento"]),
  description: z
    .string()
    .trim()
    .min(40, "Describe el negocio en al menos 40 caracteres.")
    .max(600, "Máximo 600 caracteres."),
  differentiationTag: z.string().trim().max(90, "Máximo 90 caracteres.").optional().or(z.literal("")),
  region: z.enum(REGIONES_CHILE, { message: "Elige una región." }),
  comuna: z.string().trim().min(2, "Escribe la comuna."),
  rut: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Revisa el correo.").optional().or(z.literal("")),
  website: z.string().trim().url("Usa una URL completa, con https://").optional().or(z.literal("")),
  instagram: z.string().trim().max(40).optional().or(z.literal("")),
});

export async function submitSignup(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Falta corregir algunos campos.",
      fieldErrors: fieldErrors(parsed.error),
      values: keepValues(formData),
    };
  }

  const data = parsed.data;

  if (data.tier === "emprendimiento" && !data.differentiationTag) {
    return {
      ok: false,
      message: "Falta corregir algunos campos.",
      fieldErrors: {
        differentiationTag: "Los emprendimientos entran al registro con su diferenciación declarada.",
      },
      values: keepValues(formData),
    };
  }

  try {
    await createSelfSignup({
      name: data.name,
      categorySlug: data.categorySlug,
      tier: data.tier,
      description: data.description,
      differentiationTag: data.differentiationTag || undefined,
      region: data.region,
      comuna: data.comuna,
      rut: data.rut || undefined,
      phone: data.phone || undefined,
      whatsapp: data.whatsapp || undefined,
      email: data.email || undefined,
      website: data.website || undefined,
      instagram: data.instagram || undefined,
    });
  } catch (error) {
    console.error("No se pudo registrar la autopostulación", error);
    return {
      ok: false,
      message: "No pudimos registrar el negocio. Inténtalo de nuevo.",
      values: keepValues(formData),
    };
  }

  revalidatePath("/admin/revision");

  return {
    ok: true,
    message:
      "Postulación recibida. Queda en la cola de revisión; cuando se apruebe se le asigna folio y se publica.",
  };
}

/* -------------------------------------------------------------------------- */
/* Decision de la cola de revision                                            */
/* -------------------------------------------------------------------------- */

const reviewSchema = z.object({
  businessId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  reviewer: z.string().trim().min(2, "Identifica quién revisa."),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function submitReviewDecision(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Una server action es un endpoint publico: la cola se vuelve a autorizar aqui,
  // no basta con que la pagina haya dejado entrar.
  const access = await getAdminAccess();
  if (!access.allowed) {
    return { ok: false, message: "No tienes acceso a la cola de revisión." };
  }

  const parsed = reviewSchema.safeParse({
    businessId: formData.get("businessId"),
    decision: formData.get("decision"),
    reviewer: formData.get("reviewer"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Falta corregir algunos campos.",
      fieldErrors: fieldErrors(parsed.error),
      values: keepValues(formData),
    };
  }

  try {
    await decideBusiness({
      businessId: parsed.data.businessId,
      decision: parsed.data.decision,
      reviewer: parsed.data.reviewer,
      notes: parsed.data.notes || undefined,
    });
  } catch (error) {
    console.error("No se pudo registrar la decisión", error);
    return {
      ok: false,
      message: "No pudimos guardar la decisión. Inténtalo de nuevo.",
      values: keepValues(formData),
    };
  }

  revalidatePath("/admin/revision");
  revalidatePath("/", "layout");

  return {
    ok: true,
    message:
      parsed.data.decision === "approved"
        ? "Aprobado. Se le asignó folio y ya aparece en el registro."
        : "Rechazado. No se publica y queda registrado en el log de ingesta.",
  };
}

/* -------------------------------------------------------------------------- */
/* Acceso a la cola de revision                                               */
/* -------------------------------------------------------------------------- */

export async function submitAdminToken(_prev: FormState, formData: FormData): Promise<FormState> {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) {
    return { ok: false, message: "No hay ADMIN_TOKEN configurado en el servidor." };
  }

  const given = String(formData.get("token") ?? "").trim();
  if (given !== expected) {
    return { ok: false, message: "Clave incorrecta." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin/revision");
}
