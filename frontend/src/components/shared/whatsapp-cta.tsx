import { type ReactNode } from "react";
import { getWhatsappUrl, hasWhatsappSupport, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

function WhatsappIcon({ className }: { className?: string }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface WhatsappLinkProps {
  className?: string;
  message?: string;
  children?: ReactNode;
  variant?: "hero" | "navy" | "outline" | "text" | "gold";
}

export function WhatsappLink({
  className,
  message = WHATSAPP_DEFAULT_MESSAGE,
  children,
  variant = "navy",
}: WhatsappLinkProps): ReactNode {
  const url = getWhatsappUrl(message);
  if (url === null) return null;

  const base =
    variant === "text"
      ? "inline-flex items-center gap-1.5 hover:text-white"
      : variant === "hero"
        ? "btn btn-lp inline-flex items-center justify-center gap-2 border-2 border-white/25 bg-transparent text-sm font-bold text-white hover:bg-white/5"
        : variant === "outline"
          ? "btn btn-outline btn-lp inline-flex items-center justify-center gap-2"
          : variant === "gold"
            ? "btn btn-gold btn-lp inline-flex items-center justify-center gap-2 text-sm font-bold"
            : "btn btn-navy btn-lp inline-flex items-center justify-center gap-2";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, className)}
      aria-label="Falar no WhatsApp com suporte Atlas Hub"
    >
      <WhatsappIcon className="h-4 w-4 shrink-0" />
      {children ?? "Falar no WhatsApp"}
    </a>
  );
}

export function WhatsappFab(): ReactNode {
  if (!hasWhatsappSupport()) return null;
  const url = getWhatsappUrl();
  if (url === null) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center border border-gold/40 bg-navy text-gold shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:bottom-5"
      aria-label="Abrir WhatsApp de suporte"
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}
