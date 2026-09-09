"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import { submitReviewDecision } from "@/app/actions";
import { emptyFormState } from "@/lib/form-state";
import { FormMessage } from "./FormMessage";
import { formatDate } from "@/lib/format";
import type { PendingBusiness } from "@/lib/types";

function DecisionButton({
  decision,
  children,
}: {
  decision: "approved" | "rejected";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="decision"
      value={decision}
      disabled={pending}
      className={decision === "approved" ? "boton" : "boton boton--secundario"}
    >
      {children}
    </button>
  );
}

function confidenceLabel(score: number | null): string {
  if (score === null) return "sin puntaje";
  const pct = Math.round(score * 100);
  if (score >= 0.85) return `${pct}%, confianza alta`;
  if (score >= 0.65) return `${pct}%, confianza media`;
  return `${pct}%, confianza baja`;
}

function ReviewRow({ business, reviewer }: { business: PendingBusiness; reviewer: string }) {
  const [state, formAction] = useActionState(submitReviewDecision, emptyFormState);
  const [open, setOpen] = useState(false);
  const rawId = useId();

  return (
    <article className="cartilla p-5">
      <header className="regla-campo flex flex-wrap items-start justify-between gap-3 pb-3">
        <div>
          <h2 className="folio-type text-xl text-tinta">{business.name}</h2>
          <p className="mt-1 text-sm text-salvia-tinta">
            <span>{business.category.name}</span>
            <span className="divisor-vertical" />
            <span>
              {business.comuna}, {business.region}
            </span>
            <span className="divisor-vertical" />
            <span>Ingresó el {formatDate(business.createdAt)}</span>
          </p>
        </div>

        <dl className="text-right text-sm">
          <dt className="rotulo">Origen</dt>
          <dd className="font-semibold text-tinta">
            {business.source === "osint"
              ? "Ingesta OSINT"
              : business.source === "self_signup"
                ? "Autopostulación"
                : "Carga manual"}
          </dd>
          <dt className="rotulo mt-1">Confianza</dt>
          <dd>{confidenceLabel(business.ingestion?.confidenceScore ?? null)}</dd>
        </dl>
      </header>

      <p className="texto-medida mt-3 text-[0.9375rem]">{business.description}</p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="rotulo">Carril propuesto</dt>
          <dd>{business.tier === "empresa" ? "Empresa verificada" : "Emprendimiento"}</dd>
        </div>
        <div>
          <dt className="rotulo">RUT</dt>
          <dd>{business.rut ?? "No declarado"}</dd>
        </div>
        {business.differentiationTag ? (
          <div className="sm:col-span-2">
            <dt className="rotulo">Diferenciación declarada</dt>
            <dd>{business.differentiationTag}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="rotulo">Contacto declarado</dt>
          <dd>
            {[business.phone, business.whatsapp, business.email, business.website, business.instagram]
              .filter(Boolean)
              .join("  /  ") || "Sin canales declarados"}
          </dd>
        </div>
      </dl>

      {business.ingestion ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={rawId}
            className="text-sm font-semibold text-tinta hover:text-sello"
          >
            {open ? "Ocultar" : "Ver"} datos crudos de la ingesta ({business.ingestion.runId})
          </button>

          <div id={rawId} hidden={!open} className="mt-2">
            {business.ingestion.reviewerNotes ? (
              <p className="border-l-2 border-salvia bg-papel-hueco px-3 py-2 text-sm">
                <span className="rotulo block">Nota de quien revisó antes</span>
                {business.ingestion.reviewerNotes}
              </p>
            ) : null}
            <pre className="mt-2 overflow-x-auto border border-papel-borde bg-papel-hueco p-3 text-xs">
              {JSON.stringify(business.ingestion.rawSourceData, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="regla-doble mt-5 space-y-3 pb-4">
        <input type="hidden" name="businessId" value={business.id} />
        <input type="hidden" name="reviewer" value={reviewer} />

        <FormMessage state={state} />

        <div>
          <label htmlFor={`notes-${business.id}`} className="rotulo mb-1 block">
            Nota de revisión
          </label>
          <input
            id={`notes-${business.id}`}
            name="notes"
            maxLength={400}
            defaultValue={state.values?.notes ?? ""}
            className="campo"
            placeholder="Qué se verificó o qué falta"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <DecisionButton decision="approved">Aprobar y asignar folio</DecisionButton>
          <DecisionButton decision="rejected">Rechazar</DecisionButton>
        </div>
      </form>
    </article>
  );
}

export function ReviewQueueTable({
  businesses,
  reviewer,
}: {
  businesses: PendingBusiness[];
  reviewer: string;
}) {
  if (businesses.length === 0) {
    return (
      <p className="border border-papel-borde bg-papel-hueco px-4 py-6 text-salvia-tinta">
        No queda nada pendiente en la cola.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      {businesses.map((business) => (
        <ReviewRow key={business.id} business={business} reviewer={reviewer} />
      ))}
    </div>
  );
}
