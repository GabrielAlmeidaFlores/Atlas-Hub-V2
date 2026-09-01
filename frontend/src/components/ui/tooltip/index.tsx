import { type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface TooltipProps {
  readonly content: string;
  readonly children: ReactNode;
  readonly side?: "top" | "right" | "bottom" | "left";
  readonly className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps): ReactNode {
  if (content === "") return children;

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              "z-50 max-w-xs break-all border border-border bg-navy px-2.5 py-1.5 text-xs font-medium text-white shadow-sm",
              "rounded-[8px] animate-in fade-in-0 zoom-in-95",
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
