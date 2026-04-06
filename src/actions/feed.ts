"use server";

import { db } from "@/db";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
  SubscriptionNotFoundError,
} from "@/lib/errors";
import { fetchFeedMetadata } from "@/lib/feed/parser";
import { getCurrentSession } from "@/lib/session";
import {
  type AddFeedInput,
  addFeedSchema,
  type RefreshFeedInput,
  type RemoveSubscriptionInput,
  refreshFeedSchema,
  removeSubscriptionSchema,
  type UpdateSubscriptionInput,
  updateSubscriptionSchema,
} from "@/lib/validations/feed";
import {
  addFeedToUser,
  deleteSubscription,
  getSubscriptionWithFeed,
  updateFeedMetadata,
  updateSubscription,
} from "@/services/feed";

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

/**
 * Server action to update a subscription.
 * @param input - Data to update, validated by updateSubscriptionSchema.
 */
export async function updateSubscriptionAction(input: UpdateSubscriptionInput) {
  const result = updateSubscriptionSchema.safeParse(input);

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
      error: "You must be signed in to update a subscription.",
      code: "UNAUTHORIZED",
    };
  }

  const { id, customTitle } = result.data;

  try {
    const updated = await updateSubscription(db, session.user.id, id, {
      customTitle,
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("[updateSubscriptionAction]", error);

    if (error instanceof SubscriptionNotFoundError) {
      return {
        success: false,
        error: "We couldn't find this subscription.",
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

/**
 * Server action to remove a subscription.
 * @param input - ID of the subscription to remove, validated by removeSubscriptionSchema.
 */
export async function removeSubscriptionAction(input: RemoveSubscriptionInput) {
  const result = removeSubscriptionSchema.safeParse(input);

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
      error: "You must be signed in to remove a subscription.",
      code: "UNAUTHORIZED",
    };
  }

  const { id } = result.data;

  try {
    const deleted = await deleteSubscription(db, session.user.id, id);

    return {
      success: true,
      data: deleted,
    };
  } catch (error) {
    console.error("[removeSubscriptionAction]", error);

    if (error instanceof SubscriptionNotFoundError) {
      return {
        success: false,
        error: "We couldn't find this subscription.",
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
