import { beforeEach, describe, expect, it, vi } from "vitest";
import { refreshStaleFeeds } from "@/services/feed/refresh-stale-feeds";
import { refreshFeedsHandler } from "./refresh-task";

vi.mock("@/services/feed/refresh-stale-feeds");
vi.mock("@/db", () => ({
  db: {},
}));

describe("refreshFeedsHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("successfully refreshes stale feeds", async () => {
    const mockResult = { processed: 2, success: 2, failed: 0 };
    vi.mocked(refreshStaleFeeds).mockResolvedValue(mockResult as any);

    const result = await refreshFeedsHandler({
      timestamp: new Date(),
    });

    expect(result).toEqual(mockResult);
    expect(refreshStaleFeeds).toHaveBeenCalled();
  });

  it("bubbles up errors if the service fails", async () => {
    vi.mocked(refreshStaleFeeds).mockRejectedValue(
      new Error("Service Failure"),
    );

    await expect(
      refreshFeedsHandler({
        timestamp: new Date(),
      }),
    ).rejects.toThrow("Service Failure");
  });
});
