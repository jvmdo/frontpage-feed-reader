import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { itemsQuerySchema } from "@/lib/validations/feed";
import { getItems } from "@/services/item/get-items";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to fetch items." },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const parseResult = itemsQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error:
          parseResult.error.issues[0]?.message || "Invalid query parameters",
      },
      { status: 400 },
    );
  }

  const {
    limit,
    offset,
    search,
    feedId,
    categoryId,
    saved,
    status,
    feedIds,
    sortBy,
    sortOrder,
  } = parseResult.data;

  try {
    const items = await getItems(db, session.user.id, {
      limit,
      offset,
      search,
      feedId,
      categoryId,
      bookmarkedOnly: saved,
      status,
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
