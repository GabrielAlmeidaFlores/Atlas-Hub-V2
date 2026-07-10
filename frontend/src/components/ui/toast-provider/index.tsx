import { useEffect, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type Toast } from "@/stores/toast";
import { cn } from "@/lib/utils";

const TOAST_CONFIG = {
  success: { icon: CheckCircle, bg: "bg-[#ECFDF5]", border: "border-[#A7F3D0]", text: "text-[#065F46]", iconColor: "text-green-500" },
  error:   { icon: XCircle,     bg: "bg-[#FEF2F2]", border: "border-[#FECACA]", text: "text-[#991B1B]", iconColor: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]", text: "text-[#92400E]", iconColor: "text-amber-500" },
  info:    { icon: Info,        bg: "bg-[#EFF6FF]", border: "border-[#BFDBFE]", text: "text-[#1E40AF]", iconColor: "text-blue-500" },
};

function ToastItem({ toast }: { readonly toast: Toast }): ReactNode {
  const remove = useToastStore((s) => s.removeToast);
  const c = TOAST_CONFIG[toast.type];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        "animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[12px] border p-4 shadow-lg",
        c.bg, c.border,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", c.iconColor)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", c.text)}>{toast.title}</p>
        {toast.description !== undefined && (
          <p className={cn("mt-0.5 text-xs opacity-90", c.text)}>{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => remove(toast.id)}
        className={cn("mt-0.5 shrink-0 opacity-60 transition-opacity hover:opacity-100", c.text)}
      >
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
