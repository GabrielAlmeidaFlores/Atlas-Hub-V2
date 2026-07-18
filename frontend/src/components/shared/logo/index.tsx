import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoScheme = "light" | "dark";

interface LogoProps {
  readonly size?: LogoSize;
  readonly scheme?: LogoScheme;
  readonly showIcon?: boolean;
  readonly showWordmark?: boolean;
  readonly subtitle?: string;
  readonly className?: string;
}

const ICON_SIZES: Record<LogoSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const WORDMARK_SIZES: Record<LogoSize, string> = {
  sm: "h-5",
  md: "h-6",
  lg: "h-8",
  xl: "h-10",
};

const SUBTITLE_SIZES: Record<LogoSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-xs",
  xl: "text-sm",
};

export function Logo({
  size = "md",
  scheme = "light",
  showIcon = false,
  showWordmark = true,
  subtitle,
  className,
}: LogoProps): ReactNode {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {showIcon && (
        <img
          src="/atlas-icon.png"
          alt="Atlas Hub"
          className={cn("shrink-0 object-contain", ICON_SIZES[size])}
        />
      )}
      {showWordmark && (
        <div className="flex flex-col">
          <img
            src="/atlas-logo.png"
            alt="Atlas Hub"
            className={cn(
              "object-contain object-left",
              WORDMARK_SIZES[size],
              scheme === "dark" && "brightness-0 invert",
            )}
          />
          {subtitle !== undefined && (
            <span
              className={cn(
                "leading-none",
                SUBTITLE_SIZES[size],
                scheme === "dark" ? "text-white/50" : "text-muted-foreground",
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
