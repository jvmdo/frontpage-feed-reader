import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getSubscriptions } from "@/services/subscription/get-subscriptions";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to fetch subscriptions." },
        { status: 401 },
      );
    }

    const subscriptions = await getSubscriptions(db, session.user.id);
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("[API_FEEDS_SUBSCRIPTIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}
