"use server";

import { db } from "@/db";
import {
  CategoryNotFoundError,
  InvalidMarkAllReadScopeError,
  MarkAllReadIdRequiredError,
  SubscriptionNotFoundError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type MarkAllReadInput,
  markAllReadSchema,
} from "@/lib/validations/feed";
import { markAllRead } from "@/services/feed/mark-all-read";

/**
 * Server action to mark all items in a scope as read.
 * @param input - Data containing scope and optional ID.
 */
export async function markAllReadAction(input: MarkAllReadInput) {
  const result = markAllReadSchema.safeParse(input);

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
        error: "You must be signed in to mark items as read.",
        code: "UNAUTHORIZED",
      };
    }

    await markAllRead(db, session.user.id, result.data);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[markAllReadAction]", error);

    if (error instanceof CategoryNotFoundError) {
      return {
        success: false,
        error: "The category could not be found.",
        code: error.code,
      };
    }

    if (error instanceof SubscriptionNotFoundError) {
      return {
        success: false,
        error: "The subscription could not be found.",
        code: error.code,
      };
    }

    if (error instanceof MarkAllReadIdRequiredError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    if (error instanceof InvalidMarkAllReadScopeError) {
      return {
        success: false,
        error: error.message,
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
