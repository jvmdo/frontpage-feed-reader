import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMarkAllRead } from "@/hooks/use-mark-all-read";
import { useRefreshFeed } from "@/hooks/use-refresh-feed";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { FeedToolbar } from "./feed-toolbar";

vi.mock("@/hooks/use-mark-all-read", () => ({
  useMarkAllRead: vi.fn(),
}));

vi.mock("@/hooks/use-refresh-feed", () => ({
  useRefreshFeed: vi.fn(),
}));

describe("FeedToolbar", () => {
  const mockRefresh = vi.fn();
  const mockMarkAllRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRefreshFeed).mockReturnValue({
      mutate: mockRefresh,
      isPending: false,
    } as any);

    vi.mocked(useMarkAllRead).mockReturnValue({
      mutate: mockMarkAllRead,
      isPending: false,
    } as any);

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

  it("triggers refresh when the button is clicked and a feed is selected", async () => {
    const user = userEvent.setup();
    render(<FeedToolbar />, {
      searchParams: { feedId: "123" },
    });

    const refreshButton = await screen.findByRole("button", {
      name: /refresh/i,
    });
    await user.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalledWith({ id: 123 });
  });

  it("hides refresh button when no feed is selected", async () => {
    render(<FeedToolbar />);

    await screen.findByText(/all items/i);

    const refreshButton = screen.queryByRole("button", { name: /refresh/i });

    expect(refreshButton).not.toBeInTheDocument();
  });

  describe("Mark All Read", () => {
    it("marks all as read with global scope when no filters are active", async () => {
      const user = userEvent.setup();
      render(<FeedToolbar />);

      const markAllReadBtn = await screen.findByRole("button", {
        name: /mark all read/i,
      });
      await user.click(markAllReadBtn);

      const confirmBtn = await screen.findByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(confirmBtn);

      expect(mockMarkAllRead).toHaveBeenCalledWith({
        scope: "global",
        id: undefined,
      });
    });

    it("marks all as read with category scope when categoryId is active", async () => {
      const user = userEvent.setup();
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

      expect(mockMarkAllRead).toHaveBeenCalledWith({
        scope: "category",
        id: 10,
      });
    });

    it("marks all as read with feed scope when feedId is active", async () => {
      const user = userEvent.setup();
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

      expect(mockMarkAllRead).toHaveBeenCalledWith({
        scope: "feed",
        id: 123,
      });
    });

    it("hides the button when there are no unread items", async () => {
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
      ).not.toBeInTheDocument();
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

  describe("Assign Action", () => {
    it("is visible when viewing a category", async () => {
      render(<FeedToolbar />, {
        searchParams: { categoryId: "10" },
      });

      const assignBtn = await screen.findByRole("button", { name: /assign/i });
      expect(assignBtn).toBeInTheDocument();
      expect(assignBtn).toHaveClass("hidden", "lg:inline-flex");
    });

    it("is not visible in global view", async () => {
      render(<FeedToolbar />);
      expect(
        screen.queryByRole("button", { name: /assign/i }),
      ).not.toBeInTheDocument();
    });
  });
});
