import type { Metadata } from "next";

import { AdminGate } from "@/components/AdminGate";
import { ReviewQueueTable } from "@/components/ReviewQueueTable";
import { getAdminAccess } from "@/lib/admin";
import { getPendingBusinesses, isDatabaseConfigured } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cola de revisión",
  robots: { index: false, follow: false },
};

export default async function RevisionPage() {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <header className="regla-doble pb-5">
          <p className="rotulo">Acceso restringido</p>
          <h1 className="folio-type mt-1 text-3xl text-tinta">Cola de revisión</h1>
        </header>

        {access.reason === "no-configurado" ? (
          <p className="mt-6 border-l-4 border-sello bg-papel-hueco px-3 py-2">
            Falta definir <code className="folio-type">ADMIN_TOKEN</code> en el servidor. Sin esa
            variable la cola queda cerrada en producción.
          </p>
        ) : (
          <div className="mt-6">
            <AdminGate />
          </div>
        )}
      </div>
    );
  }

  const pendientes = await getPendingBusinesses();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="regla-doble pb-5">
        <p className="rotulo">Uso interno</p>
        <h1 className="folio-type mt-1 text-3xl text-tinta sm:text-4xl">Cola de revisión</h1>
        <p className="texto-medida mt-3 text-negro/85">
          {pendientes.length === 0
            ? "Sin fichas pendientes."
            : `${pendientes.length} ${pendientes.length === 1 ? "ficha pendiente" : "fichas pendientes"} de decisión. Al aprobar se asigna el folio correlativo y la ficha se publica.`}
        </p>

        {access.mode === "desarrollo" ? (
          <p className="mt-4 border-l-4 border-sello bg-papel-hueco px-3 py-2 text-sm">
            Sin <code className="folio-type">ADMIN_TOKEN</code>: la cola está abierta porque estás
            en desarrollo. En producción quedaría cerrada.
          </p>
        ) : null}

        {!isDatabaseConfigured ? (
          <p className="mt-3 border-l-4 border-salvia bg-papel-hueco px-3 py-2 text-sm">
            Modo demo: las decisiones se aplican en memoria y se pierden al reiniciar el servidor.
          </p>
        ) : null}
      </header>

      <div className="mt-8">
        <ReviewQueueTable businesses={pendientes} reviewer="revision@registro.cl" />
      </div>
    </div>
  );
}
