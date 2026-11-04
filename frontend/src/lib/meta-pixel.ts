declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export function initMetaPixel(): void {
  if (typeof window === "undefined") return;
  const pixelId = import.meta.env["VITE_META_PIXEL_ID"] as string | undefined;
  if (pixelId === undefined || pixelId.trim().length === 0 || window.fbq !== undefined) return;
  const fbq = ((...args: unknown[]) => {
    const instance = window.fbq as unknown as { callMethod?: (...values: unknown[]) => void; queue?: unknown[][] };
    if (instance.callMethod !== undefined) instance.callMethod(...args);
    else instance.queue?.push(args);
  }) as ((...args: unknown[]) => void) & { push?: (...args: unknown[]) => void; loaded?: boolean; version?: string; queue?: unknown[][] };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

export function trackMetaEvent(event: string, data?: Record<string, string | number>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, data ?? {});
}
