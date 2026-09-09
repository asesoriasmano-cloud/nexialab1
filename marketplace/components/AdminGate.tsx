"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitAdminToken } from "@/app/actions";
import { emptyFormState } from "@/lib/form-state";
import { FormMessage } from "./FormMessage";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton" disabled={pending}>
      {pending ? "Comprobando…" : "Entrar"}
    </button>
  );
}

export function AdminGate() {
  const [state, formAction] = useActionState(submitAdminToken, emptyFormState);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <FormMessage state={state} />

      <div>
        <label htmlFor="token" className="rotulo mb-1 block">
          Clave de revisión
        </label>
        <input
          id="token"
          name="token"
          type="password"
          required
          autoComplete="current-password"
          className="campo"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
