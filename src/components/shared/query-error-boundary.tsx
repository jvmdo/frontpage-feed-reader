"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  resetKeys?: Array<unknown>;
}
export function QueryErrorBoundary({
  children,
  fallback,
  resetKeys,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={fallback}
          resetKeys={resetKeys}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
