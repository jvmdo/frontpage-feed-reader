import { NextResponse } from "next/server";
import { SyncScheduleNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { getRefreshTaskStatus } from "@/services/system/get-refresh-task-status";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to view sync status.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const payload = await getRefreshTaskStatus();

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error("[API_REFRESH_TASK_STATUS_GET]", error);

    if (error instanceof SyncScheduleNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sync status",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
