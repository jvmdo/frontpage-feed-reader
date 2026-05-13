"use client";

import { Portal } from "@ark-ui/react/portal";
import { Tour, useTour, useTourContext } from "@ark-ui/react/tour";
import { XIcon } from "lucide-react";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { steps } from "@/lib/tour-steps";
import { cn } from "@/lib/utils";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const setTourActive = useTourStore((state) => state.setTourActive);
  const setTourCompleted = useTourStore((state) => state.setTourCompleted);

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
      {children}
      <TourContextConsumer />
    </Tour.Root>
  );
}

function TourContextConsumer() {
  const tour = useTourContext();
  const isReaderStep = tour.step?.id === "reader-content";

  return (
    <Portal>
      <Tour.Backdrop
        className={cn(
          "bg-black/50 fixed! inset-0! animate-in fade-in duration-300 z-[9999]!",
          isReaderStep ? "pointer-events-none" : "pointer-events-auto",
        )}
      />
      <Tour.Spotlight className="rounded-[4px] border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-[9999]! pointer-events-none" />
      <Tour.Positioner className="z-[10000]!">
        <Tour.Content
          className={cn(
            "bg-popover border border-border rounded-lg shadow-lg p-5 relative focus:outline-none z-[10001]! isolate select-text! pointer-events-auto!",
            "animate-in fade-in zoom-in-95 duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150",
            "data-[type=dialog]:fixed! data-[type=dialog]:top-1/2! data-[type=dialog]:left-1/2! data-[type=dialog]:-translate-x-1/2! data-[type=dialog]:-translate-y-1/2! data-[type=dialog]:w-[400px]",
            "data-[type=floating]:fixed! data-[type=floating]:bottom-6! data-[type=floating]:right-6! data-[type=floating]:w-[360px]",
            "data-[type=tooltip]:w-[320px]",
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Tour.Arrow className="z-[10001]!">
            <Tour.ArrowTip className="border-t border-l border-border bg-popover" />
          </Tour.Arrow>

          <Tour.CloseTrigger
            className="absolute top-4 right-4 p-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
            aria-label="Close tour"
          >
            <XIcon className="h-4 w-4" />
          </Tour.CloseTrigger>

          <div className="flex flex-col gap-1 pr-6">
            <Tour.ProgressText className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider" />
            <Tour.Title className="text-[15px] font-semibold leading-tight text-foreground" />
            <Tour.Description className="text-[14px] leading-relaxed text-muted-foreground mt-1" />
          </div>

          <Tour.Control className="flex items-center justify-end gap-2 mt-6">
            <Tour.Actions>
              {(actions) =>
                actions.map((action) => (
                  <Tour.ActionTrigger
                    key={action.label}
                    action={action}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
                      action.action === "prev" || action.label === "Back"
                        ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {action.label}
                  </Tour.ActionTrigger>
                ))
              }
            </Tour.Actions>
          </Tour.Control>
        </Tour.Content>
      </Tour.Positioner>
    </Portal>
  );
}
