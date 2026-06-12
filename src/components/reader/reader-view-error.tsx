import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ReaderViewError({
  message,
  retry,
}: {
  message?: string;
  retry: () => void;
}) {
  return (
    <div className="p-8">
      <Alert variant="destructive">
        <AlertCircleIcon className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message ?? "Failed to load item"}</AlertDescription>
        <AlertAction>
          <Button variant="secondary" onClick={() => retry()}>
            <RefreshCwIcon data-icon="inline-start" />
            Try again
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
