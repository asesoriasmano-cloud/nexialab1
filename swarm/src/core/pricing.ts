/**
 * Precios de referencia (USD por millón de tokens, API de Anthropic, nov-2026).
 * Verifica los vigentes en https://www.anthropic.com/pricing y ajusta aquí si cambian.
 * Los tokens de razonamiento (thinking) se facturan como salida.
 */
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-fable-5-2": { input: 8, output: 40, cacheRead: 0.2 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

/** Herramienta de búsqueda web del servidor: US$10 por 1000 búsquedas. */
export const WEB_SEARCH_USD_PER_CALL = 0.01;

export function priceFor(model: string) {
  // Modelo desconocido: usamos la tarifa más alta conocida para no subestimar el gasto.
  return PRICES[model] ?? PRICES["claude-fable-5-2"]!;
}

export function isKnownModel(model: string): boolean {
  return model in PRICES;
}

export function costUsd(
  model: string,
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number; webSearches?: number },
): number {
  const p = priceFor(model);
  // Escritura de caché (5 min) = 1.25x el precio de entrada.
  return (
    (usage.inputTokens * p.input +
      usage.outputTokens * p.output +
      (usage.cacheReadTokens ?? 0) * p.cacheRead +
      (usage.cacheWriteTokens ?? 0) * p.input * 1.25) /
      1_000_000 +
    (usage.webSearches ?? 0) * WEB_SEARCH_USD_PER_CALL
  );
}

/** Estimación grosera de tokens a partir de caracteres (≈3.5 caracteres/token en español). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}
