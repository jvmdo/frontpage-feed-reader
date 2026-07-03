"use client";

import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[Auth Error]:", error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircleIcon className="size-6" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Authentication Error
        </h1>
        <p className="text-sm text-muted-foreground">
          We encountered an issue during the authentication process. This could
          be a temporary network glitch or an expired session.
        </p>
      </div>

      <Button
        variant="default"
        onClick={() => unstable_retry()}
        className="w-full mt-4"
      >
        <RotateCcwIcon className="size-4 mr-2" />
        Try again
      </Button>

      {error.digest && (
        <p className="text-xs text-muted-foreground/50 font-mono mt-2">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
