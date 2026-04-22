import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getFeedItem } from "@/services/feed/get-feed-item";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = Number.parseInt(id, 10);

  if (Number.isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  try {
    const item = await getFeedItem(db, session.user.id, itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error(`[GET /api/feeds/items/${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch feed item" },
      { status: 500 },
    );
  }
}
