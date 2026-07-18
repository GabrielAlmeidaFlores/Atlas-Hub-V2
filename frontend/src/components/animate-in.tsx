"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type AnimationType = "fade-in-up" | "fade-in" | "scale-in";

interface AnimateInProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delay?: number;
  readonly animation?: AnimationType;
  readonly threshold?: number;
}

const ANIMATION_STYLES: Record<AnimationType, string> = {
  "fade-in-up": "lp-fade-in-up 0.65s ease-out both",
  "fade-in": "lp-fade-in 0.5s ease-out both",
  "scale-in": "lp-scale-in 0.55s ease-out both",
};

export function AnimateIn({
  children,
  className,
  delay = 0,
  animation = "fade-in-up",
  threshold = 0.12,
}: AnimateInProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect((): (() => void) => {
    const el = ref.current;
    if (!el) return (): void => undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return (): void => { observer.disconnect(); };
  }, [threshold]);

  const style: CSSProperties = visible
    ? { animation: ANIMATION_STYLES[animation], animationDelay: `${String(delay)}ms` }
    : { opacity: 0 };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
