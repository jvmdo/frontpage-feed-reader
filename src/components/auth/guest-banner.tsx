"use client";

import { InfoIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { GuestDialog } from "@/components/auth/guest-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GuestBanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const session = authClient.useSession();

  if (isDismissed || (session.data && !session.data.user.isAnonymous)) {
    return null;
  }

  return (
    <>
      <div className="relative flex justify-end items-center gap-4 bg-warning px-2 text-primary-foreground md:px-4">
        <button
          type="button"
          className="lg:absolute inset-0 flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
          onClick={() => setIsDialogOpen(true)}
        >
          <InfoIcon className="size-5 shrink-0" />
          You are using a guest session. Click to keep your feeds and categories
          from an uncertain future.
        </button>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setIsDismissed(true)}
          className="z-10"
          aria-label="Dismiss banner"
        >
          <XIcon className="size-5" />
        </Button>
      </div>

      {isDialogOpen && (
        <GuestDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          dismissBanner={setIsDismissed}
        />
      )}
    </>
  );
}
