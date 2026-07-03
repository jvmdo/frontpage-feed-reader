"use client";

import "./globals.css";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]:", error);
  }, [error]);

  return (
    <html lang="en" className="antialiased">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="flex flex-col items-center text-center gap-4 max-w-md">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold tracking-tight">Critical Error</h1>
          <p className="text-muted-foreground">
            Frontpage encountered an unexpected critical error. We apologize for
            the inconvenience.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
