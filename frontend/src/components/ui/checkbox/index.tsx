import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: ReactNode;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly ariaLabel?: string;
  readonly invalid?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  id,
  disabled = false,
  className,
  ariaLabel,
  invalid = false,
}: CheckboxProps): ReactNode {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-start gap-2.5 text-sm text-foreground",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[4px] border bg-card transition-all duration-150",
            invalid ? "border-status-danger" : "border-border",
            "peer-checked:border-navy peer-checked:bg-navy peer-focus-visible:ring-2 peer-focus-visible:ring-navy/20 peer-focus-visible:ring-offset-1",
            disabled && "bg-muted",
          )}
        >
          <Check className={cn("h-3 w-3 text-white transition-opacity duration-150", checked ? "opacity-100" : "opacity-0")} />
        </span>
      </span>
      {label !== undefined && <span className="min-w-0">{label}</span>}
    </label>
  );
}
