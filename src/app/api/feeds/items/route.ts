import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUserFeedItems } from "@/services/feed/get-user-feed-items";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getUserFeedItems(db, session.user.id);
    return NextResponse.json(items);
  } catch (error) {
    console.error("[GET /api/feeds/items] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed items" },
      { status: 500 },
    );
  }
}
