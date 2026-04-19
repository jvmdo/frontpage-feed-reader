import { NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUserCategories } from "@/services/category/get-user-categories";

/**
 * GET /api/categories
 * Returns all categories for the currently authenticated user.
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
    const categories = await getUserCategories(db, session.user.id);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
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
