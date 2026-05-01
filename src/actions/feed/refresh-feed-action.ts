"use server";

import { db } from "@/db";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type RefreshFeedInput,
  refreshFeedSchema,
} from "@/lib/validations/feed";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { getSubscription } from "@/services/subscription/get-subscription";
import { getSubscriptionByFeedId } from "@/services/subscription/get-subscription-by-feed-id";

/**
 * Server action to refresh a feed.
 * @param input - ID of the subscription or feed to refresh.
 */
export async function refreshFeedAction(input: RefreshFeedInput) {
  const result = refreshFeedSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid input",
      code: "VALIDATION_ERROR",
    };
  }

  const { subscriptionId, feedId } = result.data;

  let userId: string | undefined;
  let currentSubscription = null;
  let currentFeed = null;

  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return {
        success: false,
        error: "You must be signed in to refresh a feed.",
        code: "UNAUTHORIZED",
      };
    }

    userId = session.user.id;

    const row = subscriptionId
      ? await getSubscription(db, userId, subscriptionId)
      : await getSubscriptionByFeedId(db, userId, feedId!);

    if (!row) {
      return {
        success: false,
        error: "We couldn't find this subscription.",
        code: "SUBSCRIPTION_NOT_FOUND",
      };
    }

    currentSubscription = row.subscription;
    currentFeed = row.feed;

    await ingestItems(db, currentFeed.id);

    const updatedRow = await getSubscription(db, userId, currentSubscription.id);

    return {
      success: true,
      data: {
        subscription: updatedRow?.subscription || currentSubscription,
        feed: updatedRow?.feed || currentFeed,
      },
    };
  } catch (error) {
    console.error("[refreshFeedAction]", error);

    let updatedRow = null;

    // We can only fetch the updated row if we successfully got the user ID and subscription before the error occurred.
    if (userId && currentSubscription) {
      try {
        updatedRow = await getSubscription(db, userId, currentSubscription.id);
      } catch (fallbackError) {
        console.error(
          "[refreshFeedAction] Failed to get fallback subscription:",
          fallbackError,
        );
      }
    }

    const baseResponse = {
      success: false as const,
      data: {
        subscription: updatedRow?.subscription || currentSubscription,
        feed: updatedRow?.feed || currentFeed,
      },
    };

    if (error instanceof FeedNotFoundError) {
      return {
        ...baseResponse,
        error: "We couldn't reach this URL. Please double-check for typos.",
        code: error.code,
      };
    }

    if (error instanceof FeedUnavailableError) {
      return {
        ...baseResponse,
        error:
          "The source site is currently slow or unavailable. Try again in a few minutes.",
        code: error.code,
      };
    }

    if (error instanceof FeedInvalidFormatError) {
      return {
        ...baseResponse,
        error:
          "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
        code: error.code,
      };
    }

    if (error instanceof FeedNetworkError) {
      return {
        ...baseResponse,
        error:
          "A network error occurred while reaching the feed. Please try again.",
        code: error.code,
      };
    }

    return {
      ...baseResponse,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
