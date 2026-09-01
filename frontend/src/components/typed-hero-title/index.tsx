import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypedSegment {
  readonly text: string;
  readonly tone: "base" | "gold";
}

interface TypedHeroTitleProps {
  readonly segments: readonly TypedSegment[];
  readonly className?: string;
  readonly charMs?: number;
}

export function TypedHeroTitle({
  segments,
  className,
  charMs = 32,
}: TypedHeroTitleProps): ReactNode {
  const full = segments.map((s) => s.text).join("");
  const [count, setCount] = useState(0);
  const done = count >= full.length;

  useEffect(() => {
    if (done) return;
    const delay = count === 0 ? 280 : charMs;
    const timer = window.setTimeout(() => {
      setCount((prev) => prev + 1);
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [charMs, count, done]);

  let remaining = count;
  const rendered: ReactNode[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]!;
    if (remaining <= 0) break;
    const take = Math.min(remaining, segment.text.length);
    const slice = segment.text.slice(0, take);
    remaining -= take;
    rendered.push(
      <span
        key={`${segment.tone}-${String(i)}`}
        className={segment.tone === "gold" ? "text-gold" : undefined}
      >
        {slice}
      </span>,
    );
  }

  return (
    <h1 className={cn(className)} aria-label={full}>
      <span aria-hidden>{rendered}</span>
      {!done ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] animate-pulse bg-gold align-baseline"
        />
      ) : null}
    </h1>
  );
}
