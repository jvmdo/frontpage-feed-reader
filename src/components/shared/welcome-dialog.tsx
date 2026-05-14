"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTourStore } from "@/hooks/ui/use-tour-store";

export function WelcomeDialog({ startTour }: { startTour?: () => void }) {
  const [open, setOpen] = useState(false);
  const isTourActive = useTourStore((s) => s.isTourActive);
  const isTourCompleted = useTourStore((s) => s.isTourCompleted);
  const setTourCompleted = useTourStore((s) => s.setTourCompleted);

  useEffect(() => {
    setOpen(!isTourActive && !isTourCompleted);
  }, [isTourActive, isTourCompleted]);

  const handleStart = () => {
    setOpen(false);
    startTour?.();
  };

  const handleSkip = () => {
    setOpen(false);
    setTourCompleted(true);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-[min(calc(100vw-2rem),25rem)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome to Frontpage!</AlertDialogTitle>
          <AlertDialogDescription>
            Your dashboard is ready. Would you like a quick tour to learn how to
            manage your feeds and read articles?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkip}>
            Maybe later
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStart}>
            Take the tour
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
