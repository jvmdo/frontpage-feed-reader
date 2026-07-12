import { useSuspenseQuery } from "@tanstack/react-query";
import { env } from "@/env";
import { getAbsoluteUrl } from "@/lib/utils";
import type { SystemSyncStatus } from "@/types";

export function useRefreshTaskStatus() {
  return useSuspenseQuery({
    queryKey: ["system", "refresh-task-status"],
    queryFn: async (): Promise<SystemSyncStatus> => {
      const response = await fetch(getAbsoluteUrl("/api/refresh-task-status"));

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch sync status");
      }

      return response.json();
    },
    refetchInterval: env.NEXT_PUBLIC_TRIGGER_THROTTLE_MS,
  });
}
