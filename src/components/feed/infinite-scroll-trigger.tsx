"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  enabled?: boolean;
}

/**
 * A simple component that triggers a callback when it enters the viewport.
 * Used for infinite scrolling.
 */
export function InfiniteScrollTrigger({
  onIntersect,
  enabled = true,
}: InfiniteScrollTriggerProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [onIntersect, enabled]);

  return <div ref={observerTarget} className="h-4 w-full" aria-hidden="true" />;
}
