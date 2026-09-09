import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-tinta bg-tinta text-papel">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="folio-type text-lg">Registro Pet/Vet Chile</p>
          <p className="mt-2 max-w-xs text-sm text-papel/75">
            Catastro curado del rubro de mascotas. Cada ficha pasa por revisión manual antes de
            recibir folio y publicarse.
          </p>
        </div>

        <nav aria-label="Pie de página" className="text-sm">
          <p className="rotulo text-papel/70">Secciones</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <Link href="/" className="hover:underline">
                Directorio
              </Link>
            </li>
            <li>
              <Link href="/sumar-negocio" className="hover:underline">
                Sumar mi negocio
              </Link>
            </li>
            <li>
              <Link href="/admin/revision" className="hover:underline">
                Cola de revisión
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="rotulo text-papel/70">Sobre los datos</p>
          <p className="mt-2 max-w-xs text-papel/75">
            Los negocios cargados en esta demo son ficticios y sirven para probar el diseño de las
            cartillas. No corresponden a empresas reales.
          </p>
        </div>
      </div>
    </footer>
  );
}
