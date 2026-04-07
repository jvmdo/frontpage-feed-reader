"use server";

import { db } from "@/db";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { type AddFeedInput, addFeedSchema } from "@/lib/validations/feed";
import { addFeedToUser } from "@/services/feed/add-feed-to-user";

/**
 * Server action to add a feed.
 * @param input - Data from the add feed form, validated by addFeedSchema.
 */
export async function addFeedAction(input: AddFeedInput) {
  const result = addFeedSchema.safeParse(input);

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
      error: "You must be signed in to add a feed.",
      code: "UNAUTHORIZED",
    };
  }

  const { url } = result.data;

  try {
    const subscription = await addFeedToUser(db, session.user.id, url);

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    console.error("[addFeedAction]", error);

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

    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
