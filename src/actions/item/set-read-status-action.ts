"use server";

import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import {
  type SetReadStatusInput,
  setReadStatusSchema,
} from "@/lib/validations/feed";
import { setReadStatus } from "@/services/item/set-read-status";
import type { ServerActionResult, UserItemState } from "@/types";

/**
 * Server action to set the read status of an item.
 * @param input - Item ID and target read state, validated by setReadStatusSchema.
 */
export async function setReadStatusAction(
  input: SetReadStatusInput,
): Promise<ServerActionResult<UserItemState>> {
  const result = setReadStatusSchema.safeParse(input);

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
      error: "You must be signed in to change read status.",
      code: "UNAUTHORIZED",
    };
  }

  const { itemId, isRead } = result.data;

  try {
    const state = await setReadStatus(db, session.user.id, itemId, isRead);

    return {
      success: true,
      data: state,
    };
  } catch (error) {
    console.error("[setReadStatusAction]", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
