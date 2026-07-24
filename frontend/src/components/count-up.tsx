import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CountUpProps {
  readonly end: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly duration?: number;
  readonly className?: string;
}

export function CountUp({
  end,
  prefix = "",
  suffix = "",
  duration = 1400,
  className,
}: CountUpProps): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect((): (() => void) => {
    const el = ref.current;
    if (!el) return (): void => undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return (): void => {
      observer.disconnect();
    };
  }, []);

  useEffect((): (() => void) | undefined => {
    if (!started) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return undefined;
    }

    const startAt = performance.now();
    let frame = 0;

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(end * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return (): void => {
      cancelAnimationFrame(frame);
    };
  }, [started, end, duration]);

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
