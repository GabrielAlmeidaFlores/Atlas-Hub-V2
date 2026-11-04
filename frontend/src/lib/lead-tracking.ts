export interface LeadTracking {
  readonly origem?: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
  readonly utmContent?: string;
  readonly utmTerm?: string;
  readonly metaCampaignId?: string;
  readonly metaAdId?: string;
}

const STORAGE_KEY = "atlas.lead.tracking.v1";

function clean(value: string | null): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

export function captureLeadTracking(): LeadTracking {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const current: LeadTracking = {
    origem: clean(params.get("utm_source")) ?? (document.referrer.length > 0 ? new URL(document.referrer).hostname : "direto"),
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmContent: clean(params.get("utm_content")),
    utmTerm: clean(params.get("utm_term")),
    metaCampaignId: clean(params.get("campaign_id")) ?? clean(params.get("utm_campaign_id")),
    metaAdId: clean(params.get("ad_id")) ?? clean(params.get("utm_ad_id")),
  };
  try {
    const storedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (storedRaw !== null) return JSON.parse(storedRaw) as LeadTracking;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    return current;
  }
  return current;
}
