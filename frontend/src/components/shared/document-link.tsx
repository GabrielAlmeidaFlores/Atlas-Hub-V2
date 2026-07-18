import { type ReactNode, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { openDocument } from "@/lib/documents";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";

interface Props {
  readonly href: string;
  readonly label: string;
}

export function DocumentLink({ href, label }: Props): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const [busy, setBusy] = useState(false);

  async function handleClick(): Promise<void> {
    setBusy(true);
    try {
      await openDocument(href);
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível abrir o documento", description: getApiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className="flex w-full items-center justify-between border border-border px-4 py-3 text-left text-sm hover:bg-muted disabled:opacity-50"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center bg-navy-50">
          <FileText className="h-4 w-4 text-navy" />
        </div>
        <span className="truncate font-medium text-foreground">{busy ? "Abrindo…" : label}</span>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
