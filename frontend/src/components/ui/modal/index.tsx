import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps): ReactNode {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-dark/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            className={cn(
              "pointer-events-auto w-full max-w-lg",
              "rounded-[8px] border border-border bg-card p-6 shadow-[0_8px_30px_rgb(15_23_42/0.16)]",
              "focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              className,
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <Dialog.Title className="text-base font-semibold text-foreground">{title}</Dialog.Title>
                {description !== undefined && (
                  <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close
                type="button"
                className="rounded-[8px] border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
