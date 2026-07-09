import { NextResponse } from "next/server";
import { SyncScheduleNotFoundError } from "@/lib/errors";
import { getRefreshTaskStatus } from "@/services/system/get-refresh-task-status";

export async function GET() {
  try {
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
