import { runs, schedules } from "@trigger.dev/sdk";
import { SyncScheduleNotFoundError } from "@/lib/errors";
import type { SystemSyncStatus } from "@/types";

export async function getRefreshTaskStatus(): Promise<SystemSyncStatus> {
  const schedulesList = await schedules.list();
  const schedule = schedulesList.data.find((s) => s.task === "refresh-feeds");

  if (!schedule) {
    throw new SyncScheduleNotFoundError();
  }

  const runsList = await runs.list({
    taskIdentifier: "refresh-feeds",
    limit: 1,
  });

  const latestRun = runsList.data[0];
  const isFailing =
    latestRun?.status === "FAILED" ||
    latestRun?.status === "TIMED_OUT" ||
    latestRun?.status === "CRASHED";

  return {
    active: schedule.active,
    isFailing: isFailing,
    lastRunAt: latestRun?.finishedAt?.toISOString() || null,
    nextRunAt: schedule.nextRun?.toISOString() || null,
  };
}
