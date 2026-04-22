import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { DashboardHeader } from "./dashboard-header";

const mockSubscriptions = [
  createMockFeedWithSubscription({
    feed: { id: 1, title: "Feed 1" },
    subscription: { customTitle: "My Custom Feed 1" },
  }),
  createMockFeedWithSubscription({
    feed: { id: 2, title: "Feed 2" },
  }),
];

const { markAllReadActionMock } = vi.hoisted(() => ({
  markAllReadActionMock: vi.fn(),
}));

vi.mock("@/actions/feed/mark-all-read-action", () => ({
  markAllReadAction: markAllReadActionMock,
}));

describe("DashboardHeader & DashboardBreadcrumb", () => {
  beforeEach(() => {
    markAllReadActionMock.mockResolvedValue({ success: true });
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: mockSubscriptions });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 10, name: "Tech" }],
        });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: {
            global: 5,
            categories: { 10: 3 },
            feeds: { 1: 2, 2: 0 },
          },
        });
      }),
    );
  });

  describe("DashboardHeader", () => {
    it('renders "All Items" with unread count by default when no feedId is present', async () => {
      render(<DashboardHeader />);

      // findByRole with regex needs to handle the nested span content
      expect(
        await screen.findByRole("heading", { name: /all items/i }),
      ).toBeInTheDocument();

      expect(screen.getByText(/5 unread/i)).toBeInTheDocument();
    });

    it("renders the custom title and unread count when a filtered feedId matches", async () => {
      render(<DashboardHeader />, {
        searchParams: { feedId: "1" },
      });

      expect(
        await screen.findByRole("heading", { name: /my custom feed 1/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/2 unread/i)).toBeInTheDocument();
      expect(
        screen.getByText(/articles from my custom feed 1/i),
      ).toBeInTheDocument();
    });

    it("renders the category title and unread count when filtered", async () => {
      render(<DashboardHeader />, {
        searchParams: { categoryId: "10" },
      });

      expect(
        await screen.findByRole("heading", { name: /tech/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/3 unread/i)).toBeInTheDocument();
    });

    it("does not show unread count if it is 0", async () => {
      render(<DashboardHeader />, {
        searchParams: { feedId: "2" },
      });

      const heading = await screen.findByRole("heading", { name: /feed 2/i });
      expect(heading).toBeInTheDocument();
      expect(screen.queryByText(/0 unread/i)).not.toBeInTheDocument();
      // "unread" should NOT be present at all for Feed 2 as its count is 0
      expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
    });

    it("renders the original feed title when no custom title is provided", async () => {
      render(<DashboardHeader />, {
        searchParams: { feedId: "2" },
      });

      expect(
        await screen.findByRole("heading", { name: /feed 2/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/articles from feed 2/i)).toBeInTheDocument();
    });

    it('falls back to "All Items" if the feedId does not match any subscription', async () => {
      render(<DashboardHeader />, {
        searchParams: { feedId: "999" },
      });

      expect(
        await screen.findByRole("heading", { name: /all items/i }),
      ).toBeInTheDocument();
    });

    describe("Bulk Mark Read", () => {
      const user = userEvent.setup();

      it('shows "Mark all as read" button when unread items exist', async () => {
        render(<DashboardHeader />);

        expect(
          await screen.findByRole("button", { name: /mark all as read/i }),
        ).toBeInTheDocument();
      });

      it('does not show "Mark all as read" button when unread count is 0', async () => {
        server.use(
          http.get("/api/feeds/unread-counts", () => {
            return HttpResponse.json({
              success: true,
              data: { global: 0, categories: {}, feeds: {} },
            });
          }),
        );

        render(<DashboardHeader />);

        // Heading should appear first
        expect(
          await screen.findByRole("heading", { name: /all items/i }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /mark all as read/i }),
        ).not.toBeInTheDocument();
      });

      it("opens confirmation dialog when clicking the button", async () => {
        render(<DashboardHeader />);

        const markReadBtn = await screen.findByRole("button", {
          name: /mark all as read/i,
        });
        await user.click(markReadBtn);

        expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
        expect(
          screen.getByText(/mark everything as read\?/i),
        ).toBeInTheDocument();
      });

      it("optimistically updates unread count when confirmed", async () => {
        let resolveAction!: (val: any) => void;
        const actionPromise = new Promise((resolve) => {
          resolveAction = resolve;
        });
        markAllReadActionMock.mockReturnValue(actionPromise);

        render(<DashboardHeader />);

        // Initial count
        expect(await screen.findByText(/5 unread/i)).toBeInTheDocument();

        const markReadBtn = await screen.findByRole("button", {
          name: /mark all as read/i,
        });
        await user.click(markReadBtn);

        const confirmBtn = screen.getByRole("button", {
          name: /^mark all as read$/i,
        });
        await user.click(confirmBtn);

        // OPTIMISTIC UPDATE: Count should be gone instantly
        expect(screen.queryByText(/5 unread/i)).not.toBeInTheDocument();

        // Resolve the action and wait for the dialog to close
        resolveAction({ success: true });
        await waitFor(() => {
          expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        });
      });
    });
  });

  describe("DashboardBreadcrumb", () => {
    it('renders "All Items" in the breadcrumb by default', async () => {
      render(<DashboardBreadcrumb />);

      expect(await screen.findByText(/frontpage/i)).toBeInTheDocument();
      expect(screen.getByText(/all items/i)).toBeInTheDocument();
    });

    it("renders the feed title in the breadcrumb when filtered", async () => {
      render(<DashboardBreadcrumb />, {
        searchParams: { feedId: "1" },
      });

      expect(await screen.findByText(/my custom feed 1/i)).toBeInTheDocument();
    });

    it("renders the original feed title in the breadcrumb if no custom title", async () => {
      render(<DashboardBreadcrumb />, {
        searchParams: { feedId: "2" },
      });

      expect(await screen.findByText(/feed 2/i)).toBeInTheDocument();
    });
  });
});
