import type { FormState } from "@/lib/form-state";

/** Aviso de resultado del formulario, anunciado por lector de pantalla. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;

  return (
    <p
      role="status"
      className={`border-l-4 px-3 py-2 text-sm ${
        state.ok
          ? "border-tinta bg-papel-hueco text-tinta"
          : "border-sello bg-papel-hueco text-sello"
      }`}
    >
      {state.message}
    </p>
  );
}

/** Error de un campo puntual, enlazado por aria-describedby. */
export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1 text-sm text-sello">
      {error}
    </p>
  );
}
