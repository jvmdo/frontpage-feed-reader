"use server";

import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import {
  type MarkAsReadInput,
  markAsReadSchema,
} from "@/lib/validations/feed";
import { markItemAsRead } from "@/services/feed/mark-item-as-read";

/**
 * Server action to mark a feed item as read.
 * @param input - Item ID to mark as read, validated by markAsReadSchema.
 */
export async function markAsReadAction(input: MarkAsReadInput) {
  const result = markAsReadSchema.safeParse(input);

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
      error: "You must be signed in to perform this action.",
      code: "UNAUTHORIZED",
    };
  }

  const { itemId } = result.data;

  try {
    const state = await markItemAsRead(db, session.user.id, itemId);

    return {
      success: true,
      data: state,
    };
  } catch (error) {
    console.error("[markAsReadAction]", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
