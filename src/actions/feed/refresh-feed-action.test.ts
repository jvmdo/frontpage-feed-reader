/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { refreshFeeds } from "@/services/feed/refresh-feeds";
import { refreshFeedAction } from "./refresh-feed-action";

vi.mock("@/services/feed/refresh-feeds");
vi.mock("@/lib/session");

describe("refreshFeedAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await refreshFeedAction({ scope: "invalid" as any });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await refreshFeedAction({ scope: "global" });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to refresh feeds.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success when refreshFeeds is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(refreshFeeds).mockResolvedValueOnce(undefined as any);

    const result = await refreshFeedAction({ scope: "global" });

    expect(result).toEqual({ success: true, data: undefined });
    expect(refreshFeeds).toHaveBeenCalledWith(expect.anything(), "user-123", {
      scope: "global",
    });
  });

  it("returns error if refreshFeeds returns null", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(refreshFeeds).mockResolvedValueOnce(null);

    const result = await refreshFeedAction({ scope: "feed", id: 123 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't find this subscription.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  });

  it("maps typed errors correctly", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(refreshFeeds).mockRejectedValueOnce(new FeedNotFoundError());

    const result = await refreshFeedAction({ scope: "feed", id: 123 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't reach this URL. Please double-check for typos.",
      code: "FEED_NOT_FOUND",
    });
  });

  it("handles unexpected errors", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(refreshFeeds).mockRejectedValueOnce(new Error("Boom"));

    const result = await refreshFeedAction({ scope: "global" });

    expect(result).toEqual({
      success: false,
      error: "Boom",
      code: "INTERNAL_ERROR",
    });
  });
});
