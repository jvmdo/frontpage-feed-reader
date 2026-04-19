"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertCircleIcon, RotateCcwIcon, RssIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { reset: resetQueries } = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error("[Dashboard Page]:", error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
        <p className="text-muted-foreground text-sm">
          There was an error loading your articles.
        </p>
      </div>

      <div className="flex h-112.5 flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-border/60 bg-card p-8 text-center shadow-xs">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircleIcon className="size-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Unable to load your feed
          </h2>
          <p className="mx-auto max-w-105 text-sm text-muted-foreground leading-relaxed">
            We encountered a problem while fetching the latest articles. This
            could be due to a temporary network issue or a server-side error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button
            variant="default"
            onClick={() => {
              resetQueries();
              unstable_retry();
            }}
            className="w-full sm:w-auto"
          >
            <RotateCcwIcon className="size-4" />
            Try again
          </Button>

          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/manage-feeds">
              <RssIcon className="size-4" />
              Manage subscriptions
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
