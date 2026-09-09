"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitLead } from "@/app/actions";
import { emptyFormState } from "@/lib/form-state";
import { FieldError, FormMessage } from "./FormMessage";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton--sello" disabled={pending}>
      {pending ? "Enviando…" : "Enviar consulta"}
    </button>
  );
}

type Props = {
  businessId: string;
  businessName: string;
};

export function LeadForm({ businessId, businessName }: Props) {
  const [state, formAction] = useActionState(submitLead, emptyFormState);
  const previo = state.values ?? {};

  if (state.ok) {
    return <FormMessage state={state} />;
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="businessId" value={businessId} />

      <FormMessage state={state} />

      <div>
        <label htmlFor="contactName" className="rotulo mb-1 block">
          Tu nombre
        </label>
        <input
          id="contactName"
          name="contactName"
          defaultValue={previo.contactName ?? ""}
          required
          autoComplete="name"
          className="campo"
          aria-describedby={state.fieldErrors?.contactName ? "err-contactName" : undefined}
        />
        <FieldError id="err-contactName" error={state.fieldErrors?.contactName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactPhone" className="rotulo mb-1 block">
            Teléfono
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            defaultValue={previo.contactPhone ?? ""}
            type="tel"
            autoComplete="tel"
            placeholder="+56 9 ..."
            className="campo"
            aria-describedby={state.fieldErrors?.contactPhone ? "err-contactPhone" : undefined}
          />
          <FieldError id="err-contactPhone" error={state.fieldErrors?.contactPhone} />
        </div>

        <div>
          <label htmlFor="contactEmail" className="rotulo mb-1 block">
            Correo
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            defaultValue={previo.contactEmail ?? ""}
            type="email"
            autoComplete="email"
            className="campo"
            aria-describedby={state.fieldErrors?.contactEmail ? "err-contactEmail" : undefined}
          />
          <FieldError id="err-contactEmail" error={state.fieldErrors?.contactEmail} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="rotulo mb-1 block">
          Qué necesitas
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          defaultValue={previo.message ?? ""}
          placeholder={`Cuéntale a ${businessName} qué mascota tienes y qué estás buscando.`}
          className="campo"
          aria-describedby={state.fieldErrors?.message ? "err-message" : undefined}
        />
        <FieldError id="err-message" error={state.fieldErrors?.message} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <p className="text-sm text-salvia-tinta">
          Tus datos van solo a este negocio.
        </p>
      </div>
    </form>
  );
}
