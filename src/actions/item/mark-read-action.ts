"use server";

import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import {
  type MarkReadInput,
  markReadSchema,
} from "@/lib/validations/feed";
import { markRead } from "@/services/item/mark-read";

/**
 * Server action to mark an item as read.
 * @param input - Item ID to mark as read, validated by markReadSchema.
 */
export async function markReadAction(input: MarkReadInput) {
  const result = markReadSchema.safeParse(input);

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
    const state = await markRead(db, session.user.id, itemId);

    return {
      success: true,
      data: state,
    };
  } catch (error) {
    console.error("[markReadAction]", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
