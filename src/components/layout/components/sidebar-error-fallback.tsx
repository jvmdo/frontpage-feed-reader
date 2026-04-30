"use client";

import { RotateCcwIcon } from "lucide-react";
import { useErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";

export function SidebarErrorFallback() {
  const { resetBoundary } = useErrorBoundary();

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => resetBoundary()}
      className="text-xs text-destructive hover:text-destructive/80 italic"
    >
      <RotateCcwIcon className="mr-1 size-2" />
      Subscriptions unavailable (Retry)
    </Button>
  );
}
