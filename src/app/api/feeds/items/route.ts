import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { feedItemsQuerySchema } from "@/lib/validations/feed";
import { getUserFeedItems } from "@/services/feed/get-user-feed-items";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parseResult = feedItemsQuerySchema.safeParse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
    feedId: searchParams.get("feedId"),
    categoryId: searchParams.get("categoryId"),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const { limit, offset, feedId, categoryId } = parseResult.data;

  try {
    const items = await getUserFeedItems(db, session.user.id, {
      limit,
      offset,
      feedId,
      categoryId,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[GET /api/feeds/items] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed items" },
      { status: 500 },
    );
  }
}
