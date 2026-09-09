type Props = {
  rotulo: string;
  titulo: string;
  bajada?: string;
  /** Nivel del encabezado. La cabecera de una página usa 1; las secciones, 2. */
  nivel?: 1 | 2;
};

/** Encabezado de seccion con rotulo de campo, como en un formulario impreso. */
export function SectionHeading({ rotulo, titulo, bajada, nivel = 2 }: Props) {
  const Titulo = nivel === 1 ? "h1" : "h2";

  return (
    <div className="regla-campo pb-3">
      <p className="rotulo">{rotulo}</p>
      <Titulo className="folio-type mt-1 text-2xl text-tinta sm:text-3xl">{titulo}</Titulo>
      {bajada ? <p className="texto-medida mt-2 text-salvia-tinta">{bajada}</p> : null}
    </div>
  );
}
