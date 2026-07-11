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
      {
        success: false,
        error: "You must be signed in to fetch unread counts.",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  try {
    const counts = await getUnreadCounts(db, session.user.id);

    return NextResponse.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("[GET /api/feeds/unread-counts] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch unread counts",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
