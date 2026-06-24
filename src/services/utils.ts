import { readFileSync } from "node:fs";
import { join } from "node:path";
import { subHours } from "date-fns";
import {
  type AnyColumn,
  and,
  gt,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { categories, subscriptions, userPreferences } from "@/db/schema";

/**
 * Returns a list of SQL conditions to filter items that are unread
 * based on cascading watermarks (global, category, subscription).
 *
 * An item is considered unread if it arrived (createdAt) after the watermark,
 * AND it was published (publishedAt) within a 24-hour window before the watermark
 * (or newer). This handles both the 'late arrival' protection and prevents
 * historical bulk-ingests from appearing as new unread items.
 *
 * @param createdAt - The column representing the item's arrival time.
 * @param publishedAt - The column representing the item's publication time.
 */
export function watermarkFilters(
  createdAt: AnyColumn | SQL,
  publishedAt: AnyColumn | SQL,
) {
  const ca = sql`${createdAt}`;
  const pa = sql`${publishedAt}`;

  const isUnread = (watermark: AnyColumn) =>
    or(
      isNull(watermark),
      and(
        gt(ca, watermark),
        or(isNull(pa), gt(pa, sql`${watermark} - interval '24 hours'`)),
      ),
    );

  return [
    sql`${ca} > ${subscriptions.createdAt}`,
    isUnread(userPreferences.markedAllReadAt),
    isUnread(categories.markedAllReadAt),
    isUnread(subscriptions.markedAllReadAt),
  ];
}

/**
 * Calculates the 'isRead' status for an item based on its read state and cascading watermarks.
 *
 * @param params - The individual read state and watermark timestamps.
 * @returns boolean
 */
export function calculateIsRead(params: {
  readAt: Date | null;
  itemTimestamp: Date; // createdAt
  publishedAt: Date | null;
  globalWatermark: Date | null;
  categoryWatermark: Date | null;
  subscriptionWatermark: Date | null;
  subscriptionCreatedAt: Date;
}) {
  const {
    readAt,
    itemTimestamp,
    publishedAt,
    globalWatermark,
    categoryWatermark,
    subscriptionWatermark,
    subscriptionCreatedAt,
  } = params;

  if (readAt) return true;
  if (itemTimestamp <= subscriptionCreatedAt) return true;

  const watermarks = [
    globalWatermark,
    categoryWatermark,
    subscriptionWatermark,
  ].filter((w): w is Date => w !== null);

  if (watermarks.length === 0) return false;

  const latestWatermark = new Date(
    Math.max(...watermarks.map((w) => w.getTime())),
  );

  // If item was in DB before the watermark, it's read.
  if (itemTimestamp <= latestWatermark) return true;

  // If item arrived late (after watermark), but its published date is old
  // (more than 24h before the watermark), we consider it read (part of bulk ingest).
  if (publishedAt && publishedAt <= subHours(latestWatermark, 24)) return true;

  // Otherwise, it arrived after the watermark and is relatively fresh, so it's unread.
  return false;
}

/**
 * Reads the welcome-feed.xml template from disk and processes it,
 * replacing template variables with the current timestamp and target base URL.
 *
 * @param baseUrl - The base URL/origin of the application to replace http://localhost:3000.
 */
export function getWelcomeFeedXml(baseUrl: string): string {
  const filePath = join(process.cwd(), "data", "welcome-feed.xml");
  const content = readFileSync(filePath, "utf-8");
  const now = new Date().toUTCString();
  return content
    .replaceAll("{{NOW}}", now)
    .replaceAll("http://localhost:3000", baseUrl);
}
