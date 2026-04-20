import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";

describe("DashboardBreadcrumb", () => {
  const mockCategory = createMockCategory({ id: 10, name: "Tech" });
  const mockFeedWithSub = createMockFeedWithSubscription({
    feed: { id: 1, title: "Feed 1" },
    subscription: { id: 1, customTitle: "My Feed 1", categoryId: 10 },
  });

  beforeEach(() => {
    // Set up default "happy path" handlers
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [mockFeedWithSub] });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [mockCategory] });
      }),
    );
  });

  it('renders "Frontpage > All Items" when no filter is active', async () => {
    // Override for empty state
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    render(<DashboardBreadcrumb />);

    expect(await screen.findByText("Frontpage")).toBeInTheDocument();
    expect(await screen.findByText("All Items")).toBeInTheDocument();
  });

  it('renders "Frontpage > Category" when a category is selected', async () => {
    render(<DashboardBreadcrumb />, {
      searchParams: { categoryId: "10" },
    });

    expect(await screen.findByText("Frontpage")).toBeInTheDocument();
    const categoryName = await screen.findByText("Tech");
    expect(categoryName).toBeInTheDocument();
    expect(categoryName.tagName).toBe("SPAN");
  });

  it('renders "Frontpage > Category > Feed" when a feed within a category is selected', async () => {
    render(<DashboardBreadcrumb />, {
      searchParams: { feedId: "1" },
    });

    expect(await screen.findByText("Frontpage")).toBeInTheDocument();

    const categoryLink = await screen.findByRole("link", { name: "Tech" });
    expect(categoryLink).toBeInTheDocument();
    expect(categoryLink).toHaveAttribute("href", "/dashboard?categoryId=10");

    expect(await screen.findByText("My Feed 1")).toBeInTheDocument();
    expect((await screen.findByText("My Feed 1")).tagName).toBe("SPAN");
  });

  it('renders "Frontpage > Feed" when a feed without a category is selected', async () => {
    const feedNoCat = createMockFeedWithSubscription({
      feed: { id: 2, title: "General Feed" },
      subscription: { id: 2, customTitle: null, categoryId: null },
    });

    // Surgical override for this specific test
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [feedNoCat] });
      }),
    );

    render(<DashboardBreadcrumb />, {
      searchParams: { feedId: "2" },
    });

    expect(await screen.findByText("Frontpage")).toBeInTheDocument();
    expect(screen.queryByText("Tech")).not.toBeInTheDocument();
    expect(await screen.findByText("General Feed")).toBeInTheDocument();
  });
});
