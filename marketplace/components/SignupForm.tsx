"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitSignup } from "@/app/actions";
import { emptyFormState } from "@/lib/form-state";
import { REGIONES_CHILE } from "@/lib/format";
import type { Category } from "@/lib/types";
import { FieldError, FormMessage } from "./FormMessage";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton" disabled={pending}>
      {pending ? "Enviando…" : "Enviar a revisión"}
    </button>
  );
}

/** Campo de texto con rotulo, error y ayuda opcional. */
function Campo({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="rotulo mb-1 block">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-salvia-tinta">{hint}</p> : null}
      <FieldError id={`err-${name}`} error={error} />
    </div>
  );
}

export function SignupForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(submitSignup, emptyFormState);
  const errors = state.fieldErrors ?? {};
  const previo = state.values ?? {};

  // React limpia los campos al terminar una action y `defaultValue` solo se
  // aplica al montar: los <select> y los radio quedaban en blanco tras un
  // error de validacion. Remontar el formulario con lo que devolvio la action
  // deja cada campo como lo dejo la persona.
  const formKey = state.values ? JSON.stringify(state.values) : "inicial";

  if (state.ok) {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <p className="text-sm text-salvia-tinta">
          Puedes cerrar esta página. Si falta algún dato, quien revise lo va a pedir por los canales
          que dejaste.
        </p>
      </div>
    );
  }

  return (
    <form key={formKey} action={formAction} className="space-y-8">
      <FormMessage state={state} />

      <fieldset className="space-y-4">
        <legend className="folio-type regla-campo mb-3 w-full pb-2 text-xl text-tinta">
          Identificación del negocio
        </legend>

        <Campo name="name" label="Nombre del negocio" error={errors.name}>
          <input
            id="name"
            name="name"
            required
            defaultValue={previo.name ?? ""}
            className="campo"
            aria-describedby={errors.name ? "err-name" : undefined}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo name="categorySlug" label="Categoría" error={errors.categorySlug}>
            <select id="categorySlug" name="categorySlug" required defaultValue={previo.categorySlug ?? ""} className="campo">
              <option value="" disabled>
                Elige una
              </option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            name="rut"
            label="RUT de la empresa"
            error={errors.rut}
            hint="Opcional. Sin RUT la ficha entra al carril de emprendimientos."
          >
            <input id="rut" name="rut" defaultValue={previo.rut ?? ""} className="campo" placeholder="76.123.456-7" />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="folio-type regla-campo mb-3 w-full pb-2 text-xl text-tinta">
          Carril de inscripción
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 border border-papel-borde bg-papel-hueco p-3 has-[:checked]:border-tinta has-[:checked]:bg-papel">
            <input
              type="radio"
              name="tier"
              value="empresa"
              required
              defaultChecked={previo.tier === "empresa"}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-tinta">Empresa verificada</span>
              <span className="block text-sm text-salvia-tinta">
                Con RUT y datos comprobables. Recibe sello estampado en la cartilla.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 border border-papel-borde bg-papel-hueco p-3 has-[:checked]:border-tinta has-[:checked]:bg-papel">
            <input
              type="radio"
              name="tier"
              value="emprendimiento"
              defaultChecked={previo.tier === "emprendimiento"}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-tinta">Emprendimiento</span>
              <span className="block text-sm text-salvia-tinta">
                Entra por lo que hace distinto. Requiere declarar la diferenciación.
              </span>
            </span>
          </label>
        </div>
        <FieldError id="err-tier" error={errors.tier} />

        <Campo
          name="differentiationTag"
          label="Diferenciación declarada"
          error={errors.differentiationTag}
          hint="Una línea, máximo 90 caracteres. Obligatoria para el carril de emprendimientos."
        >
          <input
            id="differentiationTag"
            name="differentiationTag"
            maxLength={90}
            defaultValue={previo.differentiationTag ?? ""}
            className="campo"
            placeholder="Grooming sin jaula, un perro por turno"
            aria-describedby={errors.differentiationTag ? "err-differentiationTag" : undefined}
          />
        </Campo>

        <Campo
          name="description"
          label="Descripción"
          error={errors.description}
          hint="Entre 40 y 600 caracteres. Qué hace el negocio y a quién atiende."
        >
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            maxLength={600}
            defaultValue={previo.description ?? ""}
            className="campo"
            aria-describedby={errors.description ? "err-description" : undefined}
          />
        </Campo>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="folio-type regla-campo mb-3 w-full pb-2 text-xl text-tinta">
          Ubicación y contacto
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo name="region" label="Región" error={errors.region}>
            <select id="region" name="region" required defaultValue={previo.region ?? ""} className="campo">
              <option value="" disabled>
                Elige una
              </option>
              {REGIONES_CHILE.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </Campo>

          <Campo name="comuna" label="Comuna" error={errors.comuna}>
            <input id="comuna" name="comuna" defaultValue={previo.comuna ?? ""} required className="campo" />
          </Campo>

          <Campo name="phone" label="Teléfono" error={errors.phone}>
            <input id="phone" name="phone" defaultValue={previo.phone ?? ""} type="tel" className="campo" placeholder="+56 2 ..." />
          </Campo>

          <Campo name="whatsapp" label="WhatsApp" error={errors.whatsapp}>
            <input id="whatsapp" name="whatsapp" defaultValue={previo.whatsapp ?? ""} type="tel" className="campo" placeholder="+56 9 ..." />
          </Campo>

          <Campo name="email" label="Correo" error={errors.email}>
            <input id="email" name="email" defaultValue={previo.email ?? ""} type="email" className="campo" />
          </Campo>

          <Campo name="website" label="Sitio web" error={errors.website}>
            <input id="website" name="website" defaultValue={previo.website ?? ""} type="url" className="campo" placeholder="https://" />
          </Campo>

          <Campo name="instagram" label="Instagram" error={errors.instagram} hint="Sin la arroba.">
            <input id="instagram" name="instagram" defaultValue={previo.instagram ?? ""} className="campo" placeholder="minegocio" />
          </Campo>
        </div>
      </fieldset>

      <div className="regla-doble flex flex-wrap items-center gap-4 pb-6">
        <SubmitButton />
        <p className="text-sm text-salvia-tinta">
          La ficha queda pendiente hasta que alguien la revise. El folio se asigna al aprobar.
        </p>
      </div>
    </form>
  );
}
