import type { ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type Toast } from "@/stores/toast";
import { cn } from "@/lib/utils";

const TOAST_CONFIG = {
  success: { icon: CheckCircle, cls: "toast toast-success", text: "text-status-success", iconColor: "text-status-success" },
  error: { icon: XCircle, cls: "toast toast-error", text: "text-status-danger", iconColor: "text-status-danger" },
  warning: { icon: AlertTriangle, cls: "toast toast-warn", text: "text-status-warning", iconColor: "text-status-warning" },
  info: { icon: Info, cls: "toast toast-info", text: "text-status-info", iconColor: "text-status-info" },
};

function ToastItem({ toast }: { readonly toast: Toast }): ReactNode {
  const remove = useToastStore((s) => s.removeToast);
  const c = TOAST_CONFIG[toast.type];
  const Icon = c.icon;

  return (
    <div className={cn("animate-in pointer-events-auto", c.cls)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", c.iconColor)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-[11px] font-bold uppercase tracking-wider", c.text)}>{toast.title}</p>
        {toast.description !== undefined && (
          <p className={cn("mt-0.5 text-xs opacity-90", c.text)}>{toast.description}</p>
        )}
      </div>
      <button type="button" onClick={() => remove(toast.id)} className={cn("mt-0.5 shrink-0 opacity-60 hover:opacity-100", c.text)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider(): ReactNode {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
