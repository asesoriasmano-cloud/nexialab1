type Props = {
  /** A donde va el GET. La home busca en todo, la categoria filtra dentro de si. */
  action: string;
  defaultQuery?: string;
  defaultRegion?: string;
  defaultTier?: string;
  regions: string[];
};

/**
 * Busqueda como formulario de consulta de registro: un GET sin JavaScript,
 * con los filtros visibles en la URL.
 */
export function SearchBar({
  action,
  defaultQuery = "",
  defaultRegion = "",
  defaultTier = "",
  regions,
}: Props) {
  return (
    <form action={action} method="get" role="search" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
      <div>
        <label htmlFor="q" className="rotulo mb-1 block">
          Buscar en el registro
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder="Nombre, comuna o servicio"
          className="campo"
        />
      </div>

      <div>
        <label htmlFor="region" className="rotulo mb-1 block">
          Región
        </label>
        <select id="region" name="region" defaultValue={defaultRegion} className="campo">
          <option value="">Todas</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tier" className="rotulo mb-1 block">
          Carril
        </label>
        <select id="tier" name="tier" defaultValue={defaultTier} className="campo">
          <option value="">Ambos</option>
          <option value="empresa">Empresas verificadas</option>
          <option value="emprendimiento">Emprendimientos</option>
        </select>
      </div>

      <div className="flex items-end">
        <button type="submit" className="boton w-full sm:w-auto">
          Consultar
        </button>
      </div>
    </form>
  );
}
