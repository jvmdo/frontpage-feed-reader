"use client";

import { useTourContext } from "@ark-ui/react/tour";
import { useEffect, useRef, useState } from "react";
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
import { useFeeds } from "@/hooks/feed/use-feeds";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { authClient } from "@/lib/auth-client";

export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const hasAttemptedShow = useRef(false);
  const { data: feeds, isLoading: isFeedsLoading } = useFeeds();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { isTourActive, isTourCompleted, setTourCompleted } = useTourStore();
  const tour = useTourContext();

  const isLoading = isFeedsLoading || isSessionPending;

  useEffect(() => {
    // If the tour is active or already completed, ensure the dialog is closed
    if (isTourActive || isTourCompleted) {
      if (open) setOpen(false);
      return;
    }

    // Don't attempt to show if already attempted in this mount or still loading
    if (hasAttemptedShow.current || isLoading) return;

    const isNewMember = feeds?.length === 0;
    const isGuest = session?.user?.isAnonymous;

    // Show tour for new members (0 feeds) or any guest user
    if (isNewMember || isGuest) {
      setOpen(true);
      hasAttemptedShow.current = true;
    }
  }, [isLoading, feeds, isTourCompleted, isTourActive, session, open]);

  const handleStart = () => {
    setOpen(false);
    tour.start();
  };

  const handleSkip = () => {
    setOpen(false);
    setTourCompleted(true);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome to Frontpage!</AlertDialogTitle>
          <AlertDialogDescription>
            Your dashboard is ready. Would you like a quick tour to learn how to manage your feeds and read articles?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkip}>Maybe later</AlertDialogCancel>
          <AlertDialogAction onClick={handleStart}>Take the tour</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
