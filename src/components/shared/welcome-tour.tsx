"use client";

import { Portal } from "@ark-ui/react/portal";
import { Tour, useTour } from "@ark-ui/react/tour";
import { ArrowRightIcon, PartyPopperIcon, XIcon } from "lucide-react";
import { WelcomeDialog } from "@/components/shared/welcome-dialog";
import { Button } from "@/components/ui/button";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { steps } from "@/lib/tour-steps";
import { cn } from "@/lib/utils";

export function WelcomeTour() {
  const setTourActive = useTourStore((s) => s.setTourActive);
  const setTourCompleted = useTourStore((s) => s.setTourCompleted);

  const tour = useTour({
    steps,
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

  return (
    <Tour.Root tour={tour}>
      <WelcomeDialog startTour={tour.start} />
      <Portal>
        <Tour.Backdrop className="z-9999 bg-black/50 pointer-events-auto" />
        <Tour.Spotlight className="z-9999 border-2 border-primary" />
        <Tour.Positioner>
          <Tour.Content
            className={cn(
              "relative z-9999 bg-popover border border-border rounded-lg shadow-lg p-5 pointer-events-auto",
              "data-[type=tooltip]:w-80 data-[type=floating]:w-90 data-[type=dialog]:w-100",
              "data-[type=floating]:fixed data-[type=floating]:bottom-6 data-[type=floating]:right-6",
              "data-[type=dialog]:fixed data-[type=dialog]:top-1/2 data-[type=dialog]:left-1/2 data-[type=dialog]:-translate-x-1/2 data-[type=dialog]:-translate-y-1/2",
            )}
          >
            <Tour.Arrow className="z-10001">
              <Tour.ArrowTip className="border-t border-l border-border bg-popover" />
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
                      <Button size="lg">
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
