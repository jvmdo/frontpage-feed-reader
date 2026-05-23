import { logger, schedules } from "@trigger.dev/sdk";
import { db } from "@/db";
import { REFRESH_CRON_SCHEDULE } from "@/lib/constants";
import { refreshStaleFeeds } from "@/services/feed/refresh-stale-feeds";

export async function refreshFeedsHandler(payload: { timestamp: Date }) {
  logger.info("Starting global feed refresh", { timestamp: payload.timestamp });

  try {
    const result = await refreshStaleFeeds(db);

    logger.info("Feed refresh completed", {
      processed: result.processed,
      success: result.success,
      failed: result.failed,
    });

    return result;
  } catch (error) {
    logger.error("Global feed refresh failed", { error });
    throw error;
  }
}

/**
 * Scheduled task that runs every 15 minutes to refresh stale feeds.
 * Deduplicates fetches across all users and respects concurrency limits.
 */
export const refreshFeedsTask = schedules.task({
  id: "refresh-feeds",
  cron: REFRESH_CRON_SCHEDULE,
  queue: {
    concurrencyLimit: 10,
  },
  run: refreshFeedsHandler,
});
