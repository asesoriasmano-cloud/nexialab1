import { formatFolio } from "@/lib/format";

type Props = {
  folio: string | null;
  /** `empresa` recibe el sello estampado; `emprendimiento` solo el folio. */
  tier: "empresa" | "emprendimiento";
  /** El sello se estampa una vez al montar la ficha, no en cada hover. */
  animate?: boolean;
  size?: "sm" | "lg";
  /** En la grilla el sello se va al extremo derecho de la cartilla. */
  spread?: boolean;
};

/**
 * Numero de folio + sello de verificacion. Es el par que debe aparecer
 * identico en toda ficha `empresa` (criterio de aceptacion 2).
 */
export function FolioBadge({ folio, tier, animate = false, size = "sm", spread = false }: Props) {
  return (
    <div className={`flex items-center gap-5 ${spread ? "w-full justify-between" : ""}`}>
      <span
        className={`folio-type text-sello ${size === "lg" ? "text-2xl" : "text-lg"}`}
        aria-label={folio ? `Folio número ${folio}` : "Ficha sin folio asignado"}
      >
        {formatFolio(folio)}
      </span>

      {tier === "empresa" ? (
        <span className={`sello${animate ? " sello--estampa" : ""}`} role="img" aria-label="Empresa verificada">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="square"
          >
            <path d="M2.5 8.5 6.2 12 13.5 4" />
          </svg>
          Verificada
        </span>
      ) : null}
    </div>
  );
}
