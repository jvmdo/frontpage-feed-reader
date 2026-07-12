"use server";

import { db } from "@/db";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { type RemoveFeedInput, removeFeedSchema } from "@/lib/validations/feed";
import { deleteSubscription } from "@/services/subscription/delete-subscription";
import type { ServerActionResult, Subscription } from "@/types";

/**
 * Server action to remove a feed.
 * @param input - ID of the subscription to remove, validated by removeFeedSchema.
 */
export async function removeFeedAction(
  input: RemoveFeedInput,
): Promise<ServerActionResult<Subscription>> {
  const result = removeFeedSchema.safeParse(input);

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
        error: "You must be signed in to remove a feed.",
        code: "UNAUTHORIZED",
      };
    }

    const { id } = result.data;

    const deleted = await deleteSubscription(db, session.user.id, id);

    return {
      success: true,
      data: deleted,
    };
  } catch (error) {
    console.error("[removeFeedAction]", error);

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
