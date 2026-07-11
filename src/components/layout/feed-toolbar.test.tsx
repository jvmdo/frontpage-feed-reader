/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markAllReadAction } from "@/actions/feed/mark-all-read-action";
import { refreshFeedAction } from "@/actions/feed/refresh-feed-action";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { useNewItemsPolling } from "@/hooks/feed/use-new-items-polling";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { FeedToolbar, FeedToolbarErrorFallback } from "./feed-toolbar";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/actions/feed/mark-all-read-action", () => ({
  markAllReadAction: vi.fn(),
}));

vi.mock("@/actions/feed/refresh-feed-action", () => ({
  refreshFeedAction: vi.fn(),
}));

vi.mock("@/hooks/feed/use-new-items-polling", () => ({
  useNewItemsPolling: vi.fn(() => ({
    newItemsCount: 0,
    handleLoadNew: vi.fn(),
  })),
}));

describe("FeedToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: { global: 10, categories: {}, feeds: {} },
        });
      }),
    );
  });

  it('renders "All Items" by default', async () => {
    render(<FeedToolbar />);

    expect(await screen.findByText("All Items")).toBeInTheDocument();
    expect(screen.getByText("10 unread")).toBeInTheDocument();
  });

  describe("Refresh Feed", () => {
    it("shows success toast when global refresh succeeds", async () => {
      const user = userEvent.setup();
      vi.mocked(refreshFeedAction).mockResolvedValue({
        success: true,
        data: undefined,
      });

      render(<FeedToolbar />);

      const refreshButton = await screen.findByRole("button", {
        name: /refresh/i,
      });
      await user.click(refreshButton);

      expect(refreshFeedAction).toHaveBeenCalledWith({ scope: "global" });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("All feeds refreshed");
      });
    });

    it("shows success toast when category refresh succeeds", async () => {
      const user = userEvent.setup();
      vi.mocked(refreshFeedAction).mockResolvedValue({
        success: true,
        data: undefined,
      });

      render(<FeedToolbar />, {
        searchParams: { categoryId: "10" },
      });

      const refreshButton = await screen.findByRole("button", {
        name: /refresh/i,
      });
      await user.click(refreshButton);

      expect(refreshFeedAction).toHaveBeenCalledWith({
        scope: "category",
        id: 10,
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Category refreshed");
      });
    });

    it("shows success toast when feed refresh succeeds", async () => {
      const user = userEvent.setup();
      vi.mocked(refreshFeedAction).mockResolvedValue({
        success: true,
        data: undefined,
      });

      render(<FeedToolbar />, {
        searchParams: { feedId: "123" },
      });

      const refreshButton = await screen.findByRole("button", {
        name: /refresh/i,
      });
      await user.click(refreshButton);

      expect(refreshFeedAction).toHaveBeenCalledWith({
        scope: "feed",
        id: 123,
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Feed refreshed");
      });
    });
  });

  describe("Mark All Read", () => {
    it("marks all as read with global scope when no filters are active", async () => {
      const user = userEvent.setup();
      vi.mocked(markAllReadAction).mockResolvedValue({ success: true });

      render(<FeedToolbar />);

      const markAllReadBtn = await screen.findByRole("button", {
        name: /mark all read/i,
      });
      await user.click(markAllReadBtn);

      const confirmBtn = await screen.findByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(confirmBtn);

      expect(markAllReadAction).toHaveBeenCalledWith({
        scope: "global",
      });
    });

    it("marks all as read with category scope when categoryId is active", async () => {
      const user = userEvent.setup();
      vi.mocked(markAllReadAction).mockResolvedValue({ success: true });

      server.use(
        http.get("/api/feeds/unread-counts", () => {
          return HttpResponse.json({
            success: true,
            data: { global: 10, categories: { "10": 5 }, feeds: {} },
          });
        }),
      );

      render(<FeedToolbar />, {
        searchParams: { categoryId: "10" },
      });

      const markAllReadBtn = await screen.findByRole("button", {
        name: /mark all read/i,
      });
      await user.click(markAllReadBtn);

      const confirmBtn = await screen.findByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(confirmBtn);

      expect(markAllReadAction).toHaveBeenCalledWith({
        scope: "category",
        id: 10,
      });
    });

    it("marks all as read with feed scope when feedId is active", async () => {
      const user = userEvent.setup();
      vi.mocked(markAllReadAction).mockResolvedValue({ success: true });

      server.use(
        http.get("/api/feeds/unread-counts", () => {
          return HttpResponse.json({
            success: true,
            data: { global: 10, categories: {}, feeds: { "123": 3 } },
          });
        }),
      );

      render(<FeedToolbar />, {
        searchParams: { feedId: "123" },
      });

      const markAllReadBtn = await screen.findByRole("button", {
        name: /mark all read/i,
      });
      await user.click(markAllReadBtn);

      const confirmBtn = await screen.findByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(confirmBtn);

      expect(markAllReadAction).toHaveBeenCalledWith({
        scope: "feed",
        id: 123,
      });
    });

    it("disables the button when there are no unread items", async () => {
      server.use(
        http.get("/api/feeds/unread-counts", () => {
          return HttpResponse.json({
            success: true,
            data: { global: 0, categories: {}, feeds: {} },
          });
        }),
      );

      render(<FeedToolbar />);

      // Wait for counts to load
      await screen.findByText("All Items");

      expect(
        screen.queryByRole("button", { name: /mark all read/i }),
      ).toBeDisabled();
    });
  });

  it("updates layout state when a toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedToolbar />);

    const gridToggle = await screen.findByLabelText(/grid view/i);
    await user.click(gridToggle);

    expect(gridToggle).toHaveAttribute("data-state", "on");
    expect(screen.getByLabelText(/list view/i)).toHaveAttribute(
      "data-state",
      "off",
    );
  });

  describe("Feed Menu (Mobile/Tablet)", () => {
    it("renders the menu trigger", async () => {
      render(<FeedToolbar />);
      expect(
        await screen.findByRole("button", { name: /feed menu/i }),
      ).toBeInTheDocument();
    });

    it("shows all actions in the dropdown by default", async () => {
      const user = userEvent.setup();
      render(<FeedToolbar />);

      const menuTrigger = await screen.findByRole("button", {
        name: /feed menu/i,
      });
      await user.click(menuTrigger);

      expect(
        screen.getByRole("menuitem", { name: /refresh/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /mark all read/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/layout/i)).toBeInTheDocument();
      expect(screen.getByText(/order/i)).toBeInTheDocument();

      // Should not show Assign when no filters are active
      expect(
        screen.queryByRole("menuitem", { name: /assign feeds/i }),
      ).not.toBeInTheDocument();
    });

    it("shows Refresh in the menu when a feed is active", async () => {
      const user = userEvent.setup();
      render(<FeedToolbar />, {
        searchParams: { feedId: "123" },
      });

      const menuTrigger = await screen.findByRole("button", {
        name: /feed menu/i,
      });
      await user.click(menuTrigger);

      expect(
        screen.getByRole("menuitem", { name: /refresh/i }),
      ).toBeInTheDocument();
    });

    it("shows Assign feeds in the menu when a category is active", async () => {
      const user = userEvent.setup();
      render(<FeedToolbar />, {
        searchParams: { categoryId: "10" },
      });

      const menuTrigger = await screen.findByRole("button", {
        name: /feed menu/i,
      });
      await user.click(menuTrigger);

      expect(
        screen.getByRole("menuitem", { name: /assign feeds/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("updates sorting state when an option is selected", async () => {
      const user = userEvent.setup();
      render(<FeedToolbar />);

      const sortTrigger = await screen.findByRole("button", {
        name: /newest/i,
      });
      await user.click(sortTrigger);

      const oldestOption = await screen.findByRole("menuitemradio", {
        name: /oldest/i,
      });
      await user.click(oldestOption);

      expect(
        screen.getByRole("button", { name: /oldest/i }),
      ).toBeInTheDocument();
    });
  });

  describe("New Items Notification", () => {
    it("renders the banner when new items are available", async () => {
      vi.mocked(useNewItemsPolling).mockReturnValue({
        newItemsCount: 5,
        handleLoadNew: vi.fn(),
      });

      render(<FeedToolbar />);

      expect(
        await screen.findByText(/5 new items available/i),
      ).toBeInTheDocument();
    });

    it("calls handleLoadNew when the banner is clicked", async () => {
      const user = userEvent.setup();
      const handleLoadNew = vi.fn();
      vi.mocked(useNewItemsPolling).mockReturnValue({
        newItemsCount: 3,
        handleLoadNew,
      });

      render(<FeedToolbar />);

      const bannerButton = await screen.findByRole("button", {
        name: /3 new items available/i,
      });
      await user.click(bannerButton);

      expect(handleLoadNew).toHaveBeenCalledTimes(1);
    });

    it("does not render text when there are no new items", async () => {
      vi.mocked(useNewItemsPolling).mockReturnValue({
        newItemsCount: 0,
        handleLoadNew: vi.fn(),
      });

      render(<FeedToolbar />);

      // The container might still be there but the button text should not be visible
      expect(
        screen.queryByText(/new items available/i),
      ).not.toBeInTheDocument();
    });

    it("displays detailed health info in the refresh tooltip", async () => {
      const user = userEvent.setup();
      const lastChecked = new Date("2024-01-01T12:00:00Z");

      // Setup mock data for feeds with an error
      server.use(
        http.get("/api/feeds/subscriptions", () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                feed: {
                  id: 1,
                  title: "Broken Feed",
                  healthStatus: "error",
                  lastFetchedAt: lastChecked.toISOString(),
                },
                subscription: { id: 101 },
              },
            ],
          });
        }),
      );

      render(<FeedToolbar />);

      const refreshButton = await screen.findByRole("button", {
        name: /refresh/i,
      });

      // Hover to trigger tooltip
      await user.hover(refreshButton);

      // Verify "Last checked" (use findAllByText as Radix might render portals/clones)
      expect(
        (await screen.findAllByText(/last checked/i)).length,
      ).toBeGreaterThan(0);

      // Verify failed sources list
      expect(
        (await screen.findAllByText(/1 source unreachable/i)).length,
      ).toBeGreaterThan(0);
      expect(
        (await screen.findAllByText("Broken Feed")).length,
      ).toBeGreaterThan(0);
    });
  });

  describe("Error Boundary Fallback", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders FeedToolbarErrorFallback when query fails and recovers on retry", async () => {
      let callCount = 0;
      server.use(
        http.get("/api/feeds/unread-counts", () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json({
            success: true,
            data: { global: 10, categories: {}, feeds: {} },
          });
        }),
      );

      render(
        <QueryErrorBoundary fallback={<FeedToolbarErrorFallback />}>
          <Suspense fallback={<div>Loading...</div>}>
            <FeedToolbar />
          </Suspense>
        </QueryErrorBoundary>,
      );

      const retryButton = await screen.findByRole("button", {
        name: /retry/i,
      });
      expect(retryButton).toBeInTheDocument();
      expect(screen.getByText("Feed details unavailable")).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(retryButton);

      expect(await screen.findByText("All Items")).toBeInTheDocument();
    });
  });
});
