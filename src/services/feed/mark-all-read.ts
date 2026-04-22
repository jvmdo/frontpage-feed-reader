import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { categories, subscriptions, userPreferences } from "@/db/schema";
import {
  CategoryNotFoundError,
  InvalidMarkAllReadScopeError,
  MarkAllReadIdRequiredError,
  SubscriptionNotFoundError,
} from "@/lib/errors";

export type MarkAllReadScope = "global" | "category" | "feed";

export interface MarkAllReadOptions {
  scope: MarkAllReadScope;
  id?: number; // categoryId or feedId
}

/**
 * Mark all items as read by updating a watermark timestamp.
 * Supports global, category, and feed-level watermarks.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user who owns the records.
 * @param options - Scope ('global', 'category', 'feed') and optional target ID.
 */
export async function markAllRead(
  db: DB,
  userId: string,
  options: MarkAllReadOptions,
) {
  const { scope, id } = options;
  const now = new Date();

  switch (scope) {
    case "global": {
      await db
        .insert(userPreferences)
        .values({ userId, markedAllReadAt: now })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: { markedAllReadAt: now },
        });
      return;
    }

    case "category": {
      if (id === undefined) {
        throw new MarkAllReadIdRequiredError("category");
      }

      const [updated] = await db
        .update(categories)
        .set({ markedAllReadAt: now })
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

      if (!updated) {
        throw new CategoryNotFoundError();
      }
      return updated;
    }

    case "feed": {
      if (id === undefined) {
        throw new MarkAllReadIdRequiredError("feed");
      }

      // We update the subscription that links this user to this feedId
      const [updated] = await db
        .update(subscriptions)
        .set({ markedAllReadAt: now })
        .where(
          and(eq(subscriptions.feedId, id), eq(subscriptions.userId, userId)),
        )
        .returning();

      if (!updated) {
        throw new SubscriptionNotFoundError();
      }
      return updated;
    }

    default: {
      throw new InvalidMarkAllReadScopeError(scope);
    }
  }
}
