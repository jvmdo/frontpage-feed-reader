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
import { refreshFeeds } from "@/services/feed/refresh-feeds";

/**
 * Server action to refresh feeds based on scope (global, category, or specific feed).
 * @param input - Scope and optional target ID.
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

  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return {
        success: false,
        error: "You must be signed in to refresh feeds.",
        code: "UNAUTHORIZED",
      };
    }

    const data = await refreshFeeds(db, session.user.id, result.data);

    if (data === null) {
      return {
        success: false,
        error: "We couldn't find this subscription.",
        code: "SUBSCRIPTION_NOT_FOUND",
      };
    }

    return {
      success: true,
      data: data ?? undefined,
    };
  } catch (error) {
    console.error("[refreshFeedAction]", error);

    if (error instanceof FeedNotFoundError) {
      return {
        success: false,
        error: "We couldn't reach this URL. Please double-check for typos.",
        code: error.code,
      };
    }

    if (error instanceof FeedUnavailableError) {
      return {
        success: false,
        error:
          "The source site is currently slow or unavailable. Try again in a few minutes.",
        code: error.code,
      };
    }

    if (error instanceof FeedInvalidFormatError) {
      return {
        success: false,
        error:
          "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
        code: error.code,
      };
    }

    if (error instanceof FeedNetworkError) {
      return {
        success: false,
        error:
          "A network error occurred while reaching the feed. Please try again.",
        code: error.code,
      };
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return {
      success: false,
      error: message,
      code: "INTERNAL_ERROR",
    };
  }
}
