import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { itemsQuerySchema } from "@/lib/validations/feed";
import { getItems } from "@/services/item/get-items";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parseResult = itemsQuerySchema.safeParse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
    feedId: searchParams.get("feedId"),
    categoryId: searchParams.get("categoryId"),
    saved: searchParams.get("saved"),
    unreadOnly: searchParams.get("unreadOnly"),
    feedIds: searchParams.get("feedIds"),
    sortBy: searchParams.get("sortBy"),
    sortOrder: searchParams.get("sortOrder"),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const {
    limit,
    offset,
    feedId,
    categoryId,
    saved,
    unreadOnly,
    feedIds,
    sortBy,
    sortOrder,
  } = parseResult.data;

  try {
    const items = await getItems(db, session.user.id, {
      limit,
      offset,
      feedId,
      categoryId,
      bookmarkedOnly: saved,
      unreadOnly,
      feedIds,
      sortBy,
      sortOrder,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[GET /api/items] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed items" },
      { status: 500 },
    );
  }
}
