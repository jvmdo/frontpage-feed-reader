import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
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

describe("DashboardHeader & DashboardBreadcrumb", () => {
  beforeEach(() => {
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
