"use client";

import { Portal } from "@ark-ui/react/portal";
import { Tour, useTour } from "@ark-ui/react/tour";
import { ArrowRightIcon, PartyPopperIcon, XIcon } from "lucide-react";
import * as React from "react";
import { WelcomeDialog } from "@/components/shared/welcome-dialog";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { steps } from "@/lib/tour-steps";
import { cn } from "@/lib/utils";

export function WelcomeTour() {
  const { setOpenMobile, isMobile } = useSidebar();
  const setTourActive = useTourStore((s) => s.setTourActive);
  const setTourCompleted = useTourStore((s) => s.setTourCompleted);
  const isTourActive = useTourStore((s) => s.isTourActive);

  const responsiveSteps = React.useMemo(() => {
    return steps.map((step) => {
      const responsiveStep = { ...step };

      // Adjust placements for mobile
      if (isMobile) {
        if (step.id === "add-feed-button") {
          responsiveStep.placement = "top";
        }
        if (step.id === "click-welcome-feed") {
          responsiveStep.placement = "bottom";
        }
      }

      return responsiveStep;
    });
  }, [isMobile]);

  const tour = useTour({
    steps: responsiveSteps,
    closeOnInteractOutside: false,
    closeOnEscape: false,
    onStatusChange: (details) => {
      if (details.status === "started") {
        setTourActive(true);
      } else if (
        details.status === "dismissed" ||
        details.status === "completed" ||
        details.status === "skipped"
      ) {
        setTourActive(false);
        setTourCompleted(true);
      }
    },
  });

  // Sync steps if they change (e.g. on window resize)
  React.useEffect(() => {
    tour.setSteps(responsiveSteps);
  }, [responsiveSteps, tour]);

  // Ensure sidebar is open on mobile during relevant steps
  React.useEffect(() => {
    if (isTourActive && isMobile) {
      const currentStepId = tour.step?.id;
      if (
        currentStepId === "wait-for-sidebar-feed" ||
        currentStepId === "click-welcome-feed"
      ) {
        setOpenMobile(true);
      }
    }
  }, [tour.step?.id, isTourActive, isMobile, setOpenMobile]);

  return (
    <Tour.Root tour={tour}>
      <WelcomeDialog startTour={tour.start} />
      <Portal>
        <Tour.Backdrop className="z-9999 bg-black/50 pointer-events-auto" />
        <Tour.Spotlight className="z-9999 border-2 border-primary" />
        <Tour.Positioner>
          <Tour.Content
            className={cn(
              "w-[min(calc(100vw-2rem),20rem)] relative z-9999 bg-popover border border-border rounded-lg shadow-2xl p-4 pointer-events-auto",
              "data-[type=floating]:w-[min(calc(100vw-2rem),22.5rem)] data-[type=floating]:fixed data-[type=floating]:bottom-6 sm:data-[type=floating]:right-6 data-[type=floating]:left-1/2 data-[type=floating]:-translate-x-1/2 sm:data-[type=floating]:left-auto sm:data-[type=floating]:translate-x-0",
              "data-[type=dialog]:w-[min(calc(100vw-2rem),25rem)] data-[type=dialog]:fixed data-[type=dialog]:top-1/2 data-[type=dialog]:left-1/2 data-[type=dialog]:-translate-x-1/2 data-[type=dialog]:-translate-y-1/2",
            )}
          >
            <Tour.Arrow className="[--arrow-size:10px] [--arrow-background:var(--color-popover)]">
              <Tour.ArrowTip className="border-t border-l" />
            </Tour.Arrow>

            <Tour.CloseTrigger
              className="absolute top-4 right-4 p-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 "
              aria-label="Close tour"
            >
              <XIcon className="h-4 w-4" />
            </Tour.CloseTrigger>

            <div className="flex flex-col gap-1 pr-6">
              <Tour.ProgressText className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider" />
              <Tour.Title className="font-semibold" />
              <Tour.Description className="text-muted-foreground" />
            </div>

            <Tour.Control className="flex justify-end">
              <Tour.Actions>
                {(actions) =>
                  actions.map((action) => (
                    <Tour.ActionTrigger
                      asChild={true}
                      key={action.label}
                      action={action}
                    >
                      <Button
                        size={isMobile ? "default" : "lg"}
                        className="mt-2"
                      >
                        {action.label}
                        {action.action === "dismiss" ? (
                          <PartyPopperIcon data-icon="inline-end" />
                        ) : (
                          <ArrowRightIcon data-icon="inline-end" />
                        )}
                      </Button>
                    </Tour.ActionTrigger>
                  ))
                }
              </Tour.Actions>
            </Tour.Control>
          </Tour.Content>
        </Tour.Positioner>
      </Portal>
    </Tour.Root>
  );
}
