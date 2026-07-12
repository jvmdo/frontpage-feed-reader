import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUnreadCounts } from "@/services/feed/get-unread-counts";

/**
 * GET /api/feeds/unread-counts
 * Returns unread counts for the currently authenticated user.
 */
export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to fetch unread counts." },
      { status: 401 },
    );
  }

  try {
    const counts = await getUnreadCounts(db, session.user.id);
    return NextResponse.json(counts);
  } catch (error) {
    console.error("[GET /api/feeds/unread-counts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread counts" },
      { status: 500 },
    );
  }
}
