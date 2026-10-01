import { type InputHTMLAttributes, type ReactNode } from "react";
import { cn, formatMoneyInput } from "@/lib/utils";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
};

export function CurrencyInput({
  value,
  onValueChange,
  className,
  ...rest
}: CurrencyInputProps): ReactNode {
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={cn("input-base", className)}
      value={value}
      onChange={(e) => onValueChange(formatMoneyInput(e.target.value))}
    />
  );
}
