import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <p className="rotulo">Error 404</p>
      <h1 className="folio-type mt-1 text-3xl text-tinta sm:text-4xl">
        No hay ficha con ese folio.
      </h1>
      <p className="texto-medida mt-3 text-negro/85">
        La página que buscas no existe, o la ficha todavía no está aprobada en el registro.
      </p>
      <Link href="/" className="boton mt-6">
        Volver al registro
      </Link>
    </div>
  );
}
