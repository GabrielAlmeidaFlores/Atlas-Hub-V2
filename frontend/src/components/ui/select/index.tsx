import type { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface SelectProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly id?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly ariaLabel?: string;
}

const EMPTY_VALUE = "__atlas_select_empty__";

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Selecione…",
  id,
  className,
  disabled = false,
  required = false,
  ariaLabel,
}: SelectProps): ReactNode {
  const hasEmptyOption = options.some((option) => option.value === "");
  const normalizedOptions = options.map((option) => ({
    ...option,
    value: option.value === "" ? EMPTY_VALUE : option.value,
  }));
  const normalizedValue = value === "" ? EMPTY_VALUE : value;

  return (
    <RadixSelect.Root
      value={normalizedValue}
      onValueChange={(next) => onValueChange(next === EMPTY_VALUE ? "" : next)}
      disabled={disabled}
      required={required}
    >
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "field flex w-full items-center justify-between gap-2 text-left outline-none",
          "data-[placeholder]:text-muted-foreground",
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          side="bottom"
          sideOffset={4}
          avoidCollisions
          collisionPadding={8}
          className={cn(
            "z-[100] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
            "rounded-[6px] border border-border bg-card text-foreground shadow-[0_10px_30px_rgb(15_23_42/0.16)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <RadixSelect.Viewport className="p-1">
            {!hasEmptyOption && (
              <RadixSelect.Item
                value={EMPTY_VALUE}
                disabled
                className="relative flex select-none items-center rounded-[4px] px-2.5 py-2 text-sm text-muted-foreground data-[disabled]:pointer-events-none"
              >
                <RadixSelect.ItemText>{placeholder}</RadixSelect.ItemText>
              </RadixSelect.Item>
            )}
            {normalizedOptions.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled ?? false}
                className={cn(
                  "relative flex cursor-pointer select-none items-center gap-2 rounded-[4px] px-2.5 py-2 text-sm outline-none",
                  "data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                )}
              >
                <RadixSelect.ItemIndicator className="flex w-4 shrink-0 items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-navy" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
