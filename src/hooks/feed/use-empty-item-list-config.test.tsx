import { QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@/tests/mocks/server";
import { createTestQueryClient, renderHook, waitFor } from "@/tests/rtl-utils";
import { useEmptyItemListConfig } from "./use-empty-item-list-config";

function createWrapper(searchParams?: Record<string, string>) {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NuqsTestingAdapter searchParams={searchParams}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    );
  };
}

describe("useEmptyItemListConfig", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/categories", () => HttpResponse.json([])),
      http.get("/api/feeds/subscriptions", () => HttpResponse.json([])),
    );
  });

  describe("unread status filter (caught-up screens)", () => {
    it("renders caught up empty state for all items", async () => {
      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "unread" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("You're all caught up!");
        expect(result.current.config.description).toBe(
          "There are no unread articles in your feed right now.",
        );
        expect(result.current.config.actionType).toBe("show-read");
      });
    });

    it("renders caught up empty state for category", async () => {
      server.use(
        http.get("/api/categories", () =>
          HttpResponse.json([{ id: 5, name: "Tech News" }]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "unread", categoryId: "5" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("All caught up in Tech News");
        expect(result.current.config.description).toBe(
          "There are no unread articles in this category right now.",
        );
        expect(result.current.config.actionType).toBe("show-read");
      });
    });

    it("renders caught up empty state for specific feed", async () => {
      server.use(
        http.get("/api/feeds/subscriptions", () =>
          HttpResponse.json([
            {
              subscription: { feedId: 4, customTitle: "My Custom Feed" },
              feed: { title: "Original Feed" },
            },
          ]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "unread", feedId: "4" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe(
          "All caught up in My Custom Feed",
        );
        expect(result.current.config.description).toBe(
          "There are no unread articles from this source right now.",
        );
        expect(result.current.config.actionType).toBe("show-read");
      });
    });

    it("renders caught up empty state for saved items", async () => {
      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "unread", saved: "true" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("No unread saved items");
        expect(result.current.config.description).toBe(
          "You've read all of your bookmarked articles.",
        );
        expect(result.current.config.actionType).toBe("show-read");
      });
    });
  });

  describe("all status filter (truly empty screens)", () => {
    it("renders default empty state", async () => {
      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "all" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("Your feed is empty");
        expect(result.current.config.description).toMatch(
          /subscribe to more feeds/i,
        );
      });
    });

    it("renders truly empty category state", async () => {
      server.use(
        http.get("/api/categories", () =>
          HttpResponse.json([{ id: 7, name: "Design" }]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "all", categoryId: "7" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("Design has no items yet");
        expect(result.current.config.actionType).toBe("assign-feeds");
      });
    });

    it("renders truly empty feed state", async () => {
      server.use(
        http.get("/api/feeds/subscriptions", () =>
          HttpResponse.json([
            {
              subscription: { feedId: 9, customTitle: "Empty Feed" },
              feed: { title: "Empty Feed" },
            },
          ]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "all", feedId: "9" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("Empty Feed is empty");
      });
    });

    it("renders truly empty saved state", async () => {
      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "all", saved: "true" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("No saved items yet");
      });
    });

    it("renders truly empty saved state with category", async () => {
      server.use(
        http.get("/api/categories", () =>
          HttpResponse.json([{ id: 7, name: "Design" }]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({
          status: "all",
          saved: "true",
          categoryId: "7",
        }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("No saved items in Design");
      });
    });

    it("renders truly empty saved state with feedIds refinement", async () => {
      server.use(
        http.get("/api/feeds/subscriptions", () =>
          HttpResponse.json([
            {
              subscription: { feedId: 9, customTitle: "Empty Feed" },
              feed: { title: "Empty Feed" },
            },
          ]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "all", saved: "true", feedIds: "9" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe(
          "No saved items from Empty Feed",
        );
      });
    });
  });

  describe("read status filter (no read articles)", () => {
    it("renders no read articles state for all items", async () => {
      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "read" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe("No read articles");
        expect(result.current.config.actionType).toBe("show-unread");
      });
    });

    it("renders no read articles state for category", async () => {
      server.use(
        http.get("/api/categories", () =>
          HttpResponse.json([{ id: 5, name: "Tech News" }]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({ status: "read", categoryId: "5" }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe(
          "No read articles in Tech News",
        );
      });
    });

    it("renders no read articles state for saved view category", async () => {
      server.use(
        http.get("/api/categories", () =>
          HttpResponse.json([{ id: 5, name: "Tech News" }]),
        ),
      );

      const { result } = renderHook(() => useEmptyItemListConfig(), {
        wrapper: createWrapper({
          status: "read",
          saved: "true",
          categoryId: "5",
        }),
      });

      await waitFor(() => {
        expect(result.current.config.title).toBe(
          "No read saved items in Tech News",
        );
      });
    });
  });
});
