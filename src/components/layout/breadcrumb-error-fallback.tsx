"use client";

import { useErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";

export function BreadcrumbErrorFallback() {
  const { resetBoundary } = useErrorBoundary();

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => resetBoundary()}
      className="text-xs text-destructive hover:text-destructive/80 italic"
    >
      Breadcrumb Error (Retry)
    </Button>
  );
}
