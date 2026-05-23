/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { countNewItems } from "@/services/item/count-new-items";
import { checkNewItemsAction } from "./check-new-items-action";

vi.mock("@/lib/session");
vi.mock("@/services/item/count-new-items");

describe("checkNewItemsAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await checkNewItemsAction({
      since: "not-a-date" as any,
    });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await checkNewItemsAction({
      since: new Date(),
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to check for new items.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and the count when check is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    const since = new Date();

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(countNewItems).mockResolvedValueOnce(5);

    const result = await checkNewItemsAction({
      since,
      feedId: 10,
    });

    expect(result).toEqual({
      success: true,
      data: { count: 5 },
    });
    expect(countNewItems).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      expect.objectContaining({
        since,
        feedId: 10,
      }),
    );
  });

  it("returns internal error on unexpected service errors", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(countNewItems).mockRejectedValueOnce(new Error("Query failed"));

    const result = await checkNewItemsAction({
      since: new Date(),
    });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred while checking for new items.",
      code: "INTERNAL_ERROR",
    });
  });
});
