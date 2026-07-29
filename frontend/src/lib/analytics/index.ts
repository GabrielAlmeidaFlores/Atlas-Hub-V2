const AID_KEY = "atlas_aid";
const SID_KEY = "atlas_sid";
const QUEUE_KEY = "atlas_aq";

export type AnalyticsProps = Record<string, unknown>;

export interface AnalyticsContext {
  path?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  browser?: string;
  os?: string;
  device?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timeZone?: string;
  country?: string;
  region?: string;
  city?: string;
}

interface QueuedEvent {
  eventName: string;
  ts: string;
  props?: AnalyticsProps;
  context?: AnalyticsContext;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${String(Date.now())}-${Math.random().toString(16).slice(2)}`;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function getOrCreate(key: string): string {
  const existing = readStorage(key);
  if (existing !== null && existing.length > 0) return existing;
  const created = uuid();
  writeStorage(key, created);
  return created;
}

function parseUtm(): Pick<AnalyticsContext, "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm"> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    ...(params.get("utm_source") ? { utmSource: params.get("utm_source") ?? undefined } : {}),
    ...(params.get("utm_medium") ? { utmMedium: params.get("utm_medium") ?? undefined } : {}),
    ...(params.get("utm_campaign") ? { utmCampaign: params.get("utm_campaign") ?? undefined } : {}),
    ...(params.get("utm_content") ? { utmContent: params.get("utm_content") ?? undefined } : {}),
    ...(params.get("utm_term") ? { utmTerm: params.get("utm_term") ?? undefined } : {}),
  };
}

function detectDevice(): Pick<AnalyticsContext, "browser" | "os" | "device"> {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const tabletUa = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || iPadOs;
  const mobileUa = /Mobi|Android.*Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const coarsePointer =
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(pointer: coarse)").matches;
  const narrowScreen = typeof window !== "undefined" && window.innerWidth > 0 && window.innerWidth < 900;
  const device = tabletUa
    ? "tablet"
    : mobileUa || (coarsePointer && narrowScreen)
      ? "mobile"
      : "desktop";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Android/i.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(ua) || iPadOs
        ? "iOS"
        : /Mac OS|Macintosh/i.test(ua)
          ? "macOS"
          : "Other";
  const browser = /Edg/i.test(ua)
    ? "Edge"
    : /Chrome|CriOS/i.test(ua)
      ? "Chrome"
      : /Firefox|FxiOS/i.test(ua)
        ? "Firefox"
        : /Safari/i.test(ua)
          ? "Safari"
          : "Other";
  return { device, os, browser };
}

function approxGeo(): Pick<AnalyticsContext, "country" | "region" | "city"> {
  if (typeof Intl === "undefined" || typeof navigator === "undefined") return {};
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "").toLowerCase();
    const language = (navigator.language ?? "").toLowerCase();
    if (
      tz.includes("sao_paulo")
      || tz.includes("fortaleza")
      || tz.includes("bahia")
      || tz.includes("manaus")
      || language.startsWith("pt-br")
    ) {
      return { country: "BR", ...(tz.includes("sao_paulo") ? { region: "SP" } : {}) };
    }
    if (tz.includes("lisbon") || language.startsWith("pt-pt")) return { country: "PT" };
    if (tz.includes("new_york") || tz.includes("chicago") || tz.includes("los_angeles")) return { country: "US" };
    if (tz.includes("buenos_aires")) return { country: "AR" };
    if (tz.includes("santiago")) return { country: "CL" };
    if (tz.includes("bogota")) return { country: "CO" };
    if (tz.includes("mexico")) return { country: "MX" };
    if (language.includes("-")) {
      const region = language.split("-")[1];
      if (region !== undefined && region.length === 2) return { country: region.toUpperCase() };
    }
  } catch {
    return {};
  }
  return {};
}

function baseContext(): AnalyticsContext {
  if (typeof window === "undefined") return {};
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  return {
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    language: navigator.language,
    ...(timeZone !== undefined ? { timeZone } as AnalyticsContext : {}),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    ...parseUtm(),
    ...detectDevice(),
    ...approxGeo(),
  };
}


let userId: string | undefined;
let flushTimer: number | undefined;
let queue: QueuedEvent[] = [];

function loadQueue(): void {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    if (raw !== null) queue = JSON.parse(raw) as QueuedEvent[];
  } catch {
    queue = [];
  }
}

function saveQueue(): void {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-40)));
  } catch {
    return;
  }
}

async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 40);
  saveQueue();
  const { VITE_API_URL } = await import("@/lib/env");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { fetchAuthSession } = await import("@aws-amplify/auth");
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token !== undefined && token !== "") headers.Authorization = `Bearer ${token}`;
  } catch {
    /* public */
  }
  try {
    await fetch(`${VITE_API_URL}/analytics/collect`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sessionId: getOrCreate(SID_KEY),
        anonymousId: getOrCreate(AID_KEY),
        ...(userId !== undefined ? { userId } : {}),
        events: batch,
      }),
      keepalive: true,
    });
  } catch {
    queue = [...batch, ...queue].slice(0, 50);
    saveQueue();
  }
}

function scheduleFlush(): void {
  if (flushTimer !== undefined) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = undefined;
    void flush();
  }, 1200);
}

export const analytics = {
  getAnonymousId(): string {
    return getOrCreate(AID_KEY);
  },
  getSessionId(): string {
    return getOrCreate(SID_KEY);
  },
  identify(id: string): void {
    userId = id;
  },
  track(eventName: string, props?: AnalyticsProps, context?: Partial<AnalyticsContext>): void {
    if (typeof window === "undefined") return;
    loadQueue();
    queue.push({
      eventName,
      ts: new Date().toISOString(),
      ...(props !== undefined ? { props } : {}),
      context: { ...baseContext(), ...context },
    });
    saveQueue();
    scheduleFlush();
  },
  page(extra?: AnalyticsProps): void {
    this.track("page_view", extra);
  },
  flush,
};

if (typeof window !== "undefined") {
  loadQueue();
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      analytics.track("exit_page");
      void flush();
    }
  });
}
