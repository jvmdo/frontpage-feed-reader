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
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({ success: true, data: { global: 5 } });
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

    it("renders the custom title and description when a filtered feedId matches", async () => {
      render(<DashboardHeader />, {
        searchParams: { feedId: "1" },
      });

      expect(
        await screen.findByRole("heading", { name: /my custom feed 1/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/articles from my custom feed 1/i),
      ).toBeInTheDocument();
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
