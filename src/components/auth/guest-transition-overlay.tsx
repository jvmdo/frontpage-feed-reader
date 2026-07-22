"use client";

import { RssIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGuestSignInStore } from "@/hooks/ui/use-guest-sign-in-store";
import { useIsSigningInAnonymous } from "@/hooks/user/use-sign-in-anonymous";

export const OVERLAY_DELAY_MS = 1500;
export const MIN_VISIBILITY_MS = 800;

const SAMPLE_CARD_TAGS = [
  { category: "Frontend", title: "React 19 & Server Components" },
  { category: "Backend", title: "Distributed Systems Architecture" },
  { category: "Design", title: "Typography & Information Density" },
];

export function GuestTransitionOverlay() {
  const pathname = usePathname();
  const isSigningIn = useIsSigningInAnonymous();
  const setIsSigningIn = useGuestSignInStore((state) => state.setIsSigningIn);

  const [showOverlay, setShowOverlay] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const shownAtRef = useRef<number | null>(null);

  useEffect(
    function autoDismissOnNavigation() {
      if (pathname.startsWith("/dashboard") && isSigningIn) {
        setIsSigningIn(false);
      }
    },
    [pathname, isSigningIn, setIsSigningIn],
  );

  useEffect(
    function manageOverlayDisplayTimers() {
      let delayTimer = null;
      let dismissTimer = null;

      if (isSigningIn) {
        delayTimer = setTimeout(() => {
          shownAtRef.current = Date.now();
          setShowOverlay(true);
        }, OVERLAY_DELAY_MS);
      } else {
        if (shownAtRef.current !== null) {
          const elapsedSinceShown = Date.now() - shownAtRef.current;
          const remainingTime = Math.max(
            0,
            MIN_VISIBILITY_MS - elapsedSinceShown,
          );

          dismissTimer = setTimeout(() => {
            setShowOverlay(false);
            shownAtRef.current = null;
          }, remainingTime);
        } else {
          setShowOverlay(false);
        }
      }

      return () => {
        if (delayTimer) clearTimeout(delayTimer);
        if (dismissTimer) clearTimeout(dismissTimer);
      };
    },
    [isSigningIn],
  );

  useEffect(
    function rotateEditorialCards() {
      if (!showOverlay) return;

      const interval = setInterval(() => {
        setCardIndex((prev) => (prev + 1) % SAMPLE_CARD_TAGS.length);
      }, 2000);

      return () => clearInterval(interval);
    },
    [showOverlay],
  );

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md pointer-events-auto select-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Setting up guest session"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center w-full max-w-[calc(100vw-1.5rem)] xs:max-w-[22rem] sm:max-w-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 border border-border/60 shadow-2xl text-center space-y-4 sm:space-y-6 overflow-hidden"
          >
            {/* Editorial Card Stacking Animation Container */}
            <div className="relative w-full h-36 sm:h-40 flex items-center justify-center pt-1 sm:pt-2 overflow-visible">
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
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-ping" />
                    </div>

                    <p className="font-serif text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
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
            <div className="space-y-1 sm:space-y-1.5 pt-1 sm:pt-2">
              <h3 className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-foreground">
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
