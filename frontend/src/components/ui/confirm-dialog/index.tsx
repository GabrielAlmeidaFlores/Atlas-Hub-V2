import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { readonly children: ReactNode }): ReactNode {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setOptions(next);
  }), []);

  function close(value: boolean): void {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onOpenChange={(next) => { if (!next) close(false); }}
        title={options?.title ?? ""}
        className="max-w-md"
      >
        <div className="space-y-5">
          <div className={cn("flex items-start gap-3 rounded-[8px] border p-3.5", options?.destructive === false ? "border-status-warning-border bg-status-warning-subtle" : "border-status-danger-border bg-status-danger-subtle")}>
            <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", options?.destructive === false ? "text-status-warning" : "text-status-danger")} />
            <p className="text-sm leading-relaxed text-foreground">
              {options?.description}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => close(false)}>
              {options?.cancelLabel ?? "Cancelar"}
            </button>
            <button
              type="button"
              className={cn("btn rounded-[8px]", options?.destructive === false ? "btn-primary" : "btn-danger")}
              onClick={() => close(true)}
            >
              {options?.confirmLabel ?? "Confirmar"}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

const fallbackConfirm: ConfirmFn = async () => false;

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext) ?? fallbackConfirm;
}
