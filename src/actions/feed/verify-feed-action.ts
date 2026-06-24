"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { parseFeedXml } from "@/lib/feed/parser";
import { getCurrentSession } from "@/lib/session";
import { fetchFeedXml } from "@/services/ingestion/fetch-feed-xml";
import type { Feed } from "@/types";

const verifyFeedSchema = z.object({
  url: z.string().url("Please enter a valid URL").trim(),
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
 *
 * NOTE FOR REVIEW:
 * This action is designed to be read-only to avoid DB write side-effects (orphaned feeds)
 * if the user decides not to complete the subscription.
 *
 * 1. Checks if the URL matches an existing feed in our database.
 * 2. If it exists, checks if the current user is already subscribed to prevent duplicates.
 * 3. If it doesn't exist, fetches the feed XML from the internet, parses it to retrieve
 *    metadata (title, description, icon), and returns it without inserting it into the database.
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

    // 1. Check if feed already exists in the database
    const existingFeed = await db.query.feeds.findFirst({
      where: eq(feeds.url, url),
    });

    if (existingFeed) {
      // Check if user is already subscribed to this feed
      const userSub = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.feedId, existingFeed.id),
        ),
      });

      return {
        success: true,
        alreadySubscribed: !!userSub,
        feed: {
          title: existingFeed.title,
          description: existingFeed.description,
          iconUrl: existingFeed.iconUrl,
        },
      };
    }

    // 2. Fetch and parse the feed XML (read-only verification)
    const fetchResult = await fetchFeedXml(url);

    if (fetchResult.status !== "success") {
      throw new FeedUnavailableError();
    }

    const parsed = await parseFeedXml(fetchResult.xml, url);
    const { metadata } = parsed;

    return {
      success: true,
      alreadySubscribed: false,
      feed: {
        title: metadata.title,
        description: metadata.description,
        iconUrl: metadata.iconUrl ?? null,
      },
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
