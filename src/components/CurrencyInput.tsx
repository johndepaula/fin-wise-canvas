import { Input } from "@/components/ui/input";
import { maskCurrencyInput } from "@/lib/currency";
import { useCallback } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Currency input that auto-formats to BRL pattern (1.234,56).
 * Stores the display value as formatted string.
 * Use parseCurrencyInput() to get the numeric value.
 */
export function CurrencyInput({ value, onChange, className, placeholder = "0,00" }: CurrencyInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCurrencyInput(raw);
    onChange(masked);
  }, [onChange]);

  return (
    <Input
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={className}
    />
  );
}
