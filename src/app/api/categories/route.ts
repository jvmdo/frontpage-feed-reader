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
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const categories = await getCategories(db, session.user.id);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("[API_CATEGORIES_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
