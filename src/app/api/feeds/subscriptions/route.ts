import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUserSubscriptions } from "@/services/feed/get-user-subscriptions";

/**
 * GET /api/feeds/subscriptions
 * Returns all subscriptions for the currently authenticated user.
 */
export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const subscriptions = await getUserSubscriptions(db, session.user.id);

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscriptions",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
