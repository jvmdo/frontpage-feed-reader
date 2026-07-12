"use server";

import { db } from "@/db";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { type UpdateFeedInput, updateFeedSchema } from "@/lib/validations/feed";
import { updateSubscription } from "@/services/subscription/update-subscription";
import type { ServerActionResult } from "@/types";

/**
 * Server action to update a subscription.
 * @param input - Data to update, validated by updateFeedSchema.
 */
export async function updateFeedAction(
  input: UpdateFeedInput,
): Promise<ServerActionResult> {
  const result = updateFeedSchema.safeParse(input);

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
        error: "You must be signed in to update a subscription.",
        code: "UNAUTHORIZED",
      };
    }

    const { id, customTitle, categoryId } = result.data;

    await updateSubscription(db, session.user.id, id, {
      customTitle,
      categoryId,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[updateFeedAction]", error);

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
