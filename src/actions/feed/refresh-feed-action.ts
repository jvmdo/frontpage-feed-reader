"use server";

import { db } from "@/db";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { fetchFeedMetadata } from "@/lib/feed/parser";
import { getCurrentSession } from "@/lib/session";
import {
  type RefreshFeedInput,
  refreshFeedSchema,
} from "@/lib/validations/feed";
import { getSubscriptionWithFeed } from "@/services/feed/get-subscriptions-with-feed";
import { updateFeedMetadata } from "@/services/feed/update-feed-metadata";

/**
 * Server action to refresh a feed.
 * @param input - ID of the subscription to refresh, validated by refreshFeedSchema.
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

  const session = await getCurrentSession();

  if (!session?.user) {
    return {
      success: false,
      error: "You must be signed in to refresh a feed.",
      code: "UNAUTHORIZED",
    };
  }

  const { id } = result.data;

  const row = await getSubscriptionWithFeed(db, session.user.id, id);

  if (!row) {
    return {
      success: false,
      error: "We couldn't find this subscription.",
      code: "SUBSCRIPTION_NOT_FOUND",
    };
  }

  const { subscription, feed } = row;

  try {
    const metadata = await fetchFeedMetadata(feed.url);

    const updatedFeed = await updateFeedMetadata(db, feed.id, {
      title: metadata.title,
      description: metadata.description,
      healthStatus: "healthy",
      lastFetchedAt: new Date(),
      lastSuccessAt: new Date(),
    });

    return {
      success: true,
      data: {
        subscription,
        feed: updatedFeed,
      },
    };
  } catch (error) {
    console.error("[refreshFeedAction]", error);

    // Update feed health status to error on failure
    const updatedFeed = await updateFeedMetadata(db, feed.id, {
      healthStatus: "error",
      lastFetchedAt: new Date(),
      lastFailureAt: new Date(),
    });

    const baseResponse = {
      success: false as const,
      // We return the updated feed data even on failure so the UI can show the error status
      data: {
        subscription,
        feed: updatedFeed,
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
