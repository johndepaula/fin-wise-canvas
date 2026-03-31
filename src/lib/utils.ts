import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Brazilian currency (R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as BR currency WITHOUT the R$ prefix (1.234,56)
 */
export function formatCurrencyPlain(value: number): string {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return "0,00";
  }
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a BR-formatted string back to a number.
 * Handles "1.234,56" → 1234.56
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove thousand separators (.) and replace decimal comma (,) with dot
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Apply BR currency mask to a raw input string while typing.
 * Always returns X,XX format (cents first, then pushes left).
 */
export function applyCurrencyMask(rawInput: string): string {
  // Keep only digits
  const digits = rawInput.replace(/\D/g, "");
  if (!digits || digits === "0" || digits === "00") return "0,00";

  // Pad to at least 3 digits so we always have 2 decimal places
  const padded = digits.padStart(3, "0");
  const intPart = padded.slice(0, -2);
  const decPart = padded.slice(-2);

  // Format integer part with dots
  const formattedInt = parseInt(intPart, 10).toLocaleString("pt-BR");

  return `${formattedInt},${decPart}`;
}
