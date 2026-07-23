"use client";

import { RssIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useIsSigningInAnonymous } from "@/hooks/user/use-sign-in-anonymous";

/**
 * Delay threshold before showing the overlay.
 * The overlay is rendered ONLY IF the operation takes longer than this value.
 */
export const OVERLAY_DELAY_MS = 1500;

/**
 * Minimum duration the overlay stays visible once rendered.
 * Prevents the modal from vanishing abruptly if the operation completes shortly after `OVERLAY_DELAY_MS`.
 */
export const MIN_VISIBILITY_MS = 2800; // If overlay is rendered, it stay mounted this value

const SAMPLE_CARD_TAGS = [
  { category: "Frontend", title: "React 19 & Server Components" },
  { category: "Backend", title: "Distributed Systems Architecture" },
  { category: "Design", title: "Typography & Information Density" },
];

export function GuestWorkspaceSetupOverlay() {
  const isSigningIn = useIsSigningInAnonymous();
  const [cardIndex, setCardIndex] = useState(0);

  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(
    function syncOverlayVisibility() {
      // Wait OVERLAY_DELAY_MS before showing overlay
      if (isSigningIn) {
        const delayTimer = setTimeout(() => {
          shownAtRef.current = Date.now();
          setVisible(true);
        }, OVERLAY_DELAY_MS);

        return () => clearTimeout(delayTimer);
      }

      // If sign-in completed < OVERLAY_DELAY_MS (overlay was never shown), hide immediately
      if (!shownAtRef.current) {
        setVisible(false);
        return;
      }

      // If overlay WAS shown, hold for remaining min visibility duration
      const elapsed = Date.now() - shownAtRef.current;
      const remainingHold = Math.max(0, MIN_VISIBILITY_MS - elapsed);

      const holdTimer = setTimeout(() => {
        setVisible(false);
        shownAtRef.current = null;
      }, remainingHold);

      return () => clearTimeout(holdTimer);
    },
    [isSigningIn],
  );

  useEffect(
    function rotateEditorialCards() {
      if (!visible) return;

      const interval = setInterval(() => {
        setCardIndex((prev) => (prev + 1) % SAMPLE_CARD_TAGS.length);
      }, 2000);

      return () => clearInterval(interval);
    },
    [visible],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-overlay-title"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[calc(100vw-1.5rem)] sm:max-w-sm p-4 sm:p-6 rounded-2xl bg-card/95 border border-border/60 shadow-2xl text-center space-y-4"
          >
            {/* Editorial Card Stacking Animation Container */}
            <div
              aria-hidden={true}
              className="relative h-[min(calc(100vh-1.5rem),8rem)] md:h-40 flex items-center"
            >
              {SAMPLE_CARD_TAGS.map((card, i) => {
                const position =
                  (i - cardIndex + SAMPLE_CARD_TAGS.length) %
                  SAMPLE_CARD_TAGS.length;

                // Position 0 = Front, 1 = Middle, 2 = Back
                const isFront = position === 0;
                const isMiddle = position === 1;

                const targetY = isFront ? 0 : isMiddle ? -10 : -20;
                const targetScale = isFront ? 1 : isMiddle ? 0.93 : 0.86;
                const targetOpacity = isFront ? 1 : isMiddle ? 0.65 : 0.35;
                const zIndex = isFront ? 30 : isMiddle ? 20 : 10;

                // Front card dropping down trajectory when cycling to back (position 2)
                const yAnimation = position === 2 ? [0, 28, -20] : targetY;

                return (
                  <motion.div
                    key={card.category}
                    initial={false}
                    style={{ zIndex }}
                    animate={{
                      y: yAnimation,
                      scale: targetScale,
                      opacity: targetOpacity,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    className="absolute inset-x-0 mx-auto w-[96%] xs:w-[94%] sm:w-[92%] p-3 sm:p-4 rounded-xl border border-border/80 bg-background shadow-md flex flex-col justify-between space-y-1.5 sm:space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        <RssIcon className="w-2.5 h-2.5" />
                        {card.category}
                      </span>
                      <span className="size-1.5 rounded-full bg-primary" />
                    </div>

                    <p className="font-serif text-xs sm:text-sm font-semibold">
                      {card.title}
                    </p>

                    {/* Shimmer Placeholder Lines */}
                    <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                      <div className="relative h-1.5 sm:h-2 w-full bg-muted/60 rounded overflow-hidden">
                        {isFront && (
                          <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/30 to-transparent animate-loading-bar" />
                        )}
                      </div>
                      <div className="relative h-1.5 sm:h-2 w-3/4 bg-muted/40 rounded overflow-hidden">
                        {isFront && (
                          <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/20 to-transparent animate-loading-bar" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Editorial Copy */}
            <div className="space-y-1.5">
              <h3
                id="guest-overlay-title"
                className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-foreground"
              >
                Setting up your guest workspace
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-65 sm:max-w-none mx-auto">
                Preparing curated RSS feeds and initializing your personalized
                dashboard...
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
