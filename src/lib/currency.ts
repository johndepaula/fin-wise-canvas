/**
 * Format a number to Brazilian Real currency string (without R$ prefix).
 * e.g. 1234.5 → "1.234,50"
 */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format with R$ prefix.
 * e.g. 1234.5 → "R$ 1.234,50"
 */
export function formatCurrencyBRL(value: number): string {
  return `R$ ${formatBRL(value)}`;
}

/**
 * Parse a currency input value (handles both dot and comma as decimal).
 * Strips non-numeric chars except last separator.
 */
export function parseCurrencyInput(raw: string): number {
  if (!raw) return 0;
  // Replace comma with dot for parsing
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Mask a raw numeric string into BRL format as the user types.
 * Input: raw digits only. Output: formatted string with comma decimal.
 * e.g. "100" → "1,00", "12345" → "123,45"
 */
export function maskCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  const formatted = (num / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted;
}
