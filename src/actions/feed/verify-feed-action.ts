"use server";

import { z } from "zod";
import { db } from "@/db";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { preprocessUrlInput } from "@/lib/url";
import { verifyFeed } from "@/services/feed/verify-feed";
import type { Feed } from "@/types";

const verifyFeedSchema = z.object({
  url: z
    .string()
    .trim()
    .transform(preprocessUrlInput)
    .pipe(z.url("Please enter a valid URL")),
});

export type VerifyFeedInput = z.infer<typeof verifyFeedSchema>;

export interface VerifiedFeedResult {
  success: boolean;
  alreadySubscribed?: boolean;
  feed?: Pick<Feed, "title" | "description" | "iconUrl">;
  error?: string;
  code?: string;
}

/**
 * Server action to verify a feed URL before subscribing.
 */
export async function verifyFeedAction(
  input: VerifyFeedInput,
): Promise<VerifiedFeedResult> {
  const result = verifyFeedSchema.safeParse(input);

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
        error: "You must be signed in to verify a feed.",
        code: "UNAUTHORIZED",
      };
    }

    const { url } = result.data;
    const verificationResult = await verifyFeed(db, session.user.id, url);

    return {
      success: true,
      ...verificationResult,
    };
  } catch (error) {
    console.error("[verifyFeedAction]", error);

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
