import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

const SECTION_SELECTOR = "[data-analytics-section]";

export function useLandingAnalytics(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    analytics.page();
    analytics.track("hero_view");

    const seenScroll = new Set<number>();
    function onScroll(): void {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.round((window.scrollY / max) * 100);
      for (const band of [25, 50, 75, 100]) {
        if (pct >= band && !seenScroll.has(band)) {
          seenScroll.add(band);
          analytics.track(`scroll_${String(band)}`, { band });
          analytics.track("heatmap_scroll", { band: String(band) });
        }
      }
    }

    const sectionSeen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const name = el.dataset["analyticsSection"] ?? "section";
          if (sectionSeen.has(name)) continue;
          sectionSeen.add(name);
          analytics.track("section_view", { section: name });
        }
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll(SECTION_SELECTOR).forEach((el) => observer.observe(el));

    function onClick(e: MouseEvent): void {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const cta = target.closest("[data-analytics-cta]");
      if (cta instanceof HTMLElement) {
        const name = cta.dataset["analyticsCta"] ?? "cta";
        analytics.track("cta_click", { cta: name });
      }
      const wa = target.closest('a[href*="wa.me"], a[href*="whatsapp"]');
      if (wa !== null) analytics.track("whatsapp_click");
      const mail = target.closest('a[href^="mailto:"]');
      if (mail !== null) analytics.track("email_click");
      const phone = target.closest('a[href^="tel:"]');
      if (phone !== null) analytics.track("phone_click");

      if (Math.random() > 0.15) return;
      const xNorm = window.innerWidth > 0 ? e.clientX / window.innerWidth : 0;
      const yNorm = document.documentElement.scrollHeight > 0
        ? (e.clientY + window.scrollY) / document.documentElement.scrollHeight
        : 0;
      analytics.track("heatmap_click", { xNorm, yNorm });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      observer.disconnect();
    };
  }, [enabled]);
}
