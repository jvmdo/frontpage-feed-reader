/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markAllReadAction } from "@/actions/feed/mark-all-read-action";
import { refreshFeedAction } from "@/actions/feed/refresh-feed-action";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { FeedToolbar } from "./feed-toolbar";

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

      expect(refreshFeedAction).toHaveBeenCalledWith({ scope: "feed", id: 123 });

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

      expect(screen.getByRole("menuitem", { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /mark all read/i })).toBeInTheDocument();
      expect(screen.getByText(/layout/i)).toBeInTheDocument();
      expect(screen.getByText(/order/i)).toBeInTheDocument();
      
      // Should not show Assign when no filters are active
      expect(screen.queryByRole("menuitem", { name: /assign feeds/i })).not.toBeInTheDocument();
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

      expect(screen.getByRole("menuitem", { name: /refresh/i })).toBeInTheDocument();
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

      expect(screen.getByRole("menuitem", { name: /assign feeds/i })).toBeInTheDocument();
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

      expect(screen.getByRole("button", { name: /oldest/i })).toBeInTheDocument();
    });
  });
});
