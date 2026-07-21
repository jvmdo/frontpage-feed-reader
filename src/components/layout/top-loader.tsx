"use client";

import NextTopLoader from "nextjs-toploader";
import { useTourStore } from "@/hooks/ui/use-tour-store";

/**
 * Client wrapper for NextTopLoader.
 * Automatically hides the top progress bar when the user is actively taking the onboarding tour.
 */
export function TopLoader() {
  const isTourActive = useTourStore((s) => s.isTourActive);

  if (isTourActive) {
    return null;
  }

  return <NextTopLoader color="var(--primary)" showSpinner={false} />;
}
