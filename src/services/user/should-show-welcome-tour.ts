import { count, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { subscriptions } from "@/db/schema";

interface ShouldShowWelcomeTourInput {
  userId: string;
  isAnonymous: boolean | null | undefined;
}

/**
 * Determines whether the welcome tour should be shown to the user.
 *
 * Rules:
 * - Anonymous users always see the tour.
 * - Authenticated users see the tour if they have no subscriptions.
 *
 * @param db Drizzle database instance
 * @param input User information
 * @returns boolean indicating if the tour should be shown
 */
export async function shouldShowWelcomeTour(
  db: DB,
  { userId, isAnonymous }: ShouldShowWelcomeTourInput,
): Promise<boolean> {
  // Anon users should always take the tour
  if (isAnonymous) return true;

  const [{ count: subsCount }] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  // Heuristic: not a new user if they have subscriptions
  return subsCount === 0;
}
