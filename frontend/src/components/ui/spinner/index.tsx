import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SpinnerProps {
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps): ReactNode {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-7 w-7 border-2", lg: "h-10 w-10 border-[3px]" };
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-navy-200 border-t-navy",
        sizes[size],
        className,
      )}
    />
  );
}

export function PageSpinner(): ReactNode {
  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center sm:min-h-[300px]">
      <Spinner size="lg" />
    </div>
  );
}
