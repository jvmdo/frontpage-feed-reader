import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getCategories } from "@/services/category/get-categories";

/**
 * GET /api/categories
 * Returns all categories for the currently authenticated user.
 */
export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to fetch categories." },
        { status: 401 },
      );
    }

    const categories = await getCategories(db, session.user.id);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API_CATEGORIES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
