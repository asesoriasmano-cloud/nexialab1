import type { Metadata } from "next";

import { SignupForm } from "@/components/SignupForm";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sumar mi negocio",
  description:
    "Postula tu veterinaria, pet shop o emprendimiento al registro pet/vet de Chile. Revisión manual antes de publicar.",
};

export default async function SumarNegocioPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="regla-doble pb-5">
        <p className="rotulo">Formulario de inscripción</p>
        <h1 className="folio-type mt-1 text-3xl text-tinta sm:text-4xl">Sumar mi negocio</h1>
        <p className="texto-medida mt-3 text-negro/85">
          Completa la ficha con los datos que quieres que queden publicados. Entra a la cola de
          revisión con estado pendiente y se publica una vez aprobada, con su folio asignado.
        </p>
      </header>

      <div className="mt-8">
        <SignupForm categories={categories} />
      </div>
    </div>
  );
}
