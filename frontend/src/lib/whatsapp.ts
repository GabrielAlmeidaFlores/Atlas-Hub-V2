import { VITE_WHATSAPP_NUMBER } from "@/lib/env";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá, sou incorporadora e quero suporte sobre o Atlas Hub.";

export function hasWhatsappSupport(): boolean {
  return VITE_WHATSAPP_NUMBER.length >= 10;
}

export function getWhatsappUrl(message: string = WHATSAPP_DEFAULT_MESSAGE): string | null {
  if (!hasWhatsappSupport()) return null;
  const text = encodeURIComponent(message);
  return `https://wa.me/${VITE_WHATSAPP_NUMBER}?text=${text}`;
}
