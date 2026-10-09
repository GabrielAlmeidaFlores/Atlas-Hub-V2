import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Device = "desktop" | "mobile";

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1440, mobile: 390 };

function previewSrc(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}__preview=1`;
}

export function HeatmapPreview({
  path,
  device,
  clicks,
  scrolls,
  className,
}: {
  readonly path: string;
  readonly device: Device;
  readonly clicks: { x: number; y: number; count: number }[];
  readonly scrolls: { band: string; count: number }[];
  readonly className?: string;
}): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const deviceWidth = DEVICE_WIDTH[device];
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / deviceWidth) : 0;
  const displayWidth = deviceWidth * scale;
  const displayHeight = contentHeight * scale;
  const maxClick = Math.max(1, ...clicks.map((c) => c.count));
  const maxScroll = Math.max(1, ...scrolls.map((s) => s.count));
  const cols = 100;
  const rows = 200;

  useEffect(() => {
    const el = containerRef.current;
    if (el === null) return;
    setContainerWidth(el.clientWidth);
    const observer = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function measure(): void {
    const doc = iframeRef.current?.contentDocument;
    if (doc === null || doc === undefined) return;
    const height = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
    if (height > 0) setContentHeight(height);
  }

  useEffect(() => {
    setIsLoading(true);
    setContentHeight(0);
  }, [path, device]);

  function onLoad(): void {
    measure();
    window.setTimeout(measure, 600);
    window.setTimeout(() => {
      measure();
      setIsLoading(false);
    }, 1400);
  }

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {device === "desktop" ? "Computador" : "Celular"} · tela real renderizada
        </span>
        <span className="tabular-nums">
          {clicks.length} ponto{clicks.length === 1 ? "" : "s"} de clique
        </span>
      </div>

      <div
        className="relative mx-auto overflow-auto border border-border bg-white"
        style={{ width: displayWidth > 0 ? displayWidth : "100%", maxHeight: "72vh" }}
      >
        {isLoading && (
          <div className="pointer-events-none sticky top-2 z-30 flex justify-center">
            <span className="border border-border bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
              Renderizando a tela...
            </span>
          </div>
        )}
        <div
          className="relative"
          style={{ width: displayWidth > 0 ? displayWidth : "100%", height: displayHeight > 0 ? displayHeight : 320 }}
        >
        <div
          className="absolute left-0 top-0"
          style={{
            width: deviceWidth,
            height: contentHeight > 0 ? contentHeight : "100%",
            transform: `scale(${String(scale)})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            key={previewSrc(path) + device}
            ref={iframeRef}
            src={previewSrc(path)}
            title={`Prévia de ${path}`}
            onLoad={onLoad}
            tabIndex={-1}
            className="pointer-events-none border-0"
            style={{ width: deviceWidth, height: contentHeight > 0 ? contentHeight : "100%" }}
          />

          {contentHeight > 0 && (
            <div className="pointer-events-none absolute inset-0">
              {scrolls.map((s) => {
                const pct = Number(s.band);
                if (!Number.isFinite(pct)) return null;
                return (
                  <div
                    key={s.band}
                    className="absolute left-0 flex w-full items-center gap-2"
                    style={{ top: `${String(pct)}%`, opacity: 0.25 + (s.count / maxScroll) * 0.75 }}
                  >
                    <div className="h-px flex-1 bg-gold" />
                    <span className="bg-white/85 px-1 text-[10px] font-semibold tabular-nums text-navy">
                      {`${s.band}% · ${String(s.count)}`}
                    </span>
                  </div>
                );
              })}

              {clicks.map((c) => (
                <span
                  key={`${String(c.x)}-${String(c.y)}`}
                  className="absolute rounded-full bg-gold/70 ring-1 ring-gold"
                  style={{
                    left: `${String(((c.x + 0.5) / cols) * 100)}%`,
                    top: `${String(((c.y + 0.5) / rows) * 100)}%`,
                    width: 22 * (0.6 + (c.count / maxClick) * 1.4),
                    height: 22 * (0.6 + (c.count / maxClick) * 1.4),
                    transform: "translate(-50%, -50%)",
                    opacity: 0.3 + (c.count / maxClick) * 0.6,
                  }}
                  title={`${String(c.count)} clique${c.count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          )}
        </div>
        </div>

        {!isLoading && contentHeight === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Não foi possível pré-visualizar esta tela agora.
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          Cliques
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gold/40" />
            <span className="h-3 w-3 rounded-full bg-gold/70" />
            <span className="h-4 w-4 rounded-full bg-gold/90" />
          </span>
          mais frequente
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-px w-6 bg-gold" /> profundidade de rolagem
        </span>
      </div>
    </div>
  );
}
