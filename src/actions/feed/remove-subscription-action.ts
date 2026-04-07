"use server";

import { db } from "@/db";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type RemoveSubscriptionInput,
  removeSubscriptionSchema,
} from "@/lib/validations/feed";
import { deleteSubscription } from "@/services/feed/delete-subscription";

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
