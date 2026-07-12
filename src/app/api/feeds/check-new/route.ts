import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { checkNewItemsSchema } from "@/lib/validations/feed";
import { countNewItems } from "@/services/item/count-new-items";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to check for new items." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const feedId = searchParams.get("feedId");
    const categoryId = searchParams.get("categoryId");
    const unreadOnly = searchParams.get("unreadOnly");

    const result = checkNewItemsSchema.safeParse({
      since: since || undefined,
      feedId: feedId && feedId !== "null" ? feedId : undefined,
      categoryId: categoryId && categoryId !== "null" ? categoryId : undefined,
      unreadOnly: unreadOnly || undefined,
      feedIds: searchParams.get("feedIds") || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const count = await countNewItems(db, session.user.id, result.data);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[GET /api/feeds/check-new]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while checking for new items." },
      { status: 500 },
    );
  }
}
