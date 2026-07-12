import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { preprocessUrlInput } from "@/lib/url";
import { verifyFeed } from "@/services/feed/verify-feed";

const verifyQuerySchema = z.object({
  url: z
    .string()
    .trim()
    .transform(preprocessUrlInput)
    .pipe(z.url("Please enter a valid URL")),
});

const ERROR_STATUS_MAP: Record<string, number> = {
  FEED_NOT_FOUND: 404,
  FEED_UNAVAILABLE: 503,
  FEED_INVALID_FORMAT: 422,
  FEED_NETWORK_ERROR: 502,
};

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to verify a feed." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    const result = verifyQuerySchema.safeParse({ url: rawUrl });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { url } = result.data;
    const verificationResult = await verifyFeed(db, session.user.id, url);

    return NextResponse.json(verificationResult, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("[GET /api/feeds/verify]", error);

    const code = (error as { code?: string }).code;
    const status = code ? ERROR_STATUS_MAP[code] : undefined;

    if (status && code) {
      const errorMessages: Record<string, string> = {
        FEED_NOT_FOUND:
          "We couldn't reach this URL. Please double-check for typos.",
        FEED_UNAVAILABLE:
          "The source site is currently slow or unavailable. Try again in a few minutes.",
        FEED_INVALID_FORMAT:
          "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
        FEED_NETWORK_ERROR:
          "A network error occurred while reaching the feed. Please try again.",
      };
      const errorMessage = errorMessages[code] || (error as Error).message;
      return NextResponse.json({ error: errorMessage }, { status });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
