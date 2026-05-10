"use client";

import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Item page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          Back
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>
                {error.message || "Failed to load the article. Please try again."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="w-fit gap-2"
              >
                <RotateCcwIcon className="size-4" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}
