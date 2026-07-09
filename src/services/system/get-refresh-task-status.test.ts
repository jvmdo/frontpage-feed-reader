import { runs, schedules } from "@trigger.dev/sdk";
import { describe, expect, it, vi } from "vitest";
import { SyncScheduleNotFoundError } from "@/lib/errors";
import { getRefreshTaskStatus } from "./get-refresh-task-status";

vi.mock("@trigger.dev/sdk", () => ({
  schedules: {
    list: vi.fn(),
  },
  runs: {
    list: vi.fn(),
  },
}));

describe("getRefreshTaskStatus", () => {
  const mockDate = new Date("2026-01-01T12:00:00Z");

  it("throws SyncScheduleNotFoundError when the schedule is missing", async () => {
    vi.mocked(schedules.list).mockResolvedValueOnce({ data: [] } as any);

    await expect(getRefreshTaskStatus()).rejects.toThrow(
      SyncScheduleNotFoundError,
    );
  });

  it("returns healthy status with no past runs (first time setup)", async () => {
    vi.mocked(schedules.list).mockResolvedValueOnce({
      data: [{ task: "refresh-feeds", active: true, nextRun: mockDate }],
    } as any);

    vi.mocked(runs.list).mockResolvedValueOnce({ data: [] } as any);

    const status = await getRefreshTaskStatus();

    expect(status).toEqual({
      active: true,
      isFailing: false,
      lastRunAt: null,
      nextRunAt: mockDate.toISOString(),
    });
  });

  it("returns healthy status when the latest run was successful", async () => {
    vi.mocked(schedules.list).mockResolvedValueOnce({
      data: [{ task: "refresh-feeds", active: true, nextRun: mockDate }],
    } as any);

    vi.mocked(runs.list).mockResolvedValueOnce({
      data: [
        { status: "COMPLETED", finishedAt: new Date("2026-01-01T11:00:00Z") },
      ],
    } as any);

    const status = await getRefreshTaskStatus();

    expect(status.isFailing).toBe(false);
    expect(status.lastRunAt).toBe("2026-01-01T11:00:00.000Z");
  });

  it.each([
    "FAILED",
    "TIMED_OUT",
    "CRASHED",
  ])("returns failing status when latest run status is %s", async (runStatus) => {
    vi.mocked(schedules.list).mockResolvedValueOnce({
      data: [{ task: "refresh-feeds", active: true, nextRun: mockDate }],
    } as any);

    vi.mocked(runs.list).mockResolvedValueOnce({
      data: [{ status: runStatus, finishedAt: mockDate }],
    } as any);

    const status = await getRefreshTaskStatus();

    expect(status.isFailing).toBe(true);
  });

  it("returns healthy status when latest run is still EXECUTING or QUEUED", async () => {
    vi.mocked(schedules.list).mockResolvedValueOnce({
      data: [{ task: "refresh-feeds", active: true, nextRun: mockDate }],
    } as any);

    vi.mocked(runs.list).mockResolvedValueOnce({
      data: [{ status: "EXECUTING", finishedAt: null }],
    } as any);

    const status = await getRefreshTaskStatus();

    expect(status.isFailing).toBe(false);
    expect(status.lastRunAt).toBeNull();
  });
});
