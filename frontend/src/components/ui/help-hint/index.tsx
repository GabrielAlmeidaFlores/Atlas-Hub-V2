import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip } from "../tooltip";

interface HelpHintProps {
  readonly content: string;
}

export function HelpHint({ content }: HelpHintProps): ReactNode {
  if (content === "") return null;

  return (
    <Tooltip content={content} side="top">
      <button
        type="button"
        aria-label="Ajuda"
        className="inline-flex shrink-0 cursor-help items-center text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}
