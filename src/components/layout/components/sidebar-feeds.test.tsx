import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { SidebarFeeds } from "./sidebar-feeds";

// Mock next/navigation's usePathname and useSearchParams
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next/link's useLinkStatus
vi.mock("next/link", async () => {
  const actual = await vi.importActual("next/link");
  return {
    ...actual,
    useLinkStatus: vi.fn(() => ({ pending: false })),
  };
});

const mockCategories = [
  createMockCategory({ id: 10, name: "Tech" }),
  createMockCategory({ id: 20, name: "Design" }),
];

const mockSubscriptions = [
  createMockFeedWithSubscription({
    feed: { id: 1, title: "Tech Feed" },
    subscription: { categoryId: 10 },
  }),
  createMockFeedWithSubscription({
    feed: { id: 2, title: "Design Feed" },
    subscription: { categoryId: 20 },
  }),
  createMockFeedWithSubscription({
    feed: { id: 3, title: "Uncategorized Feed" },
    subscription: { categoryId: null },
  }),
];

describe("SidebarFeeds", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: mockSubscriptions });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: mockCategories });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: {
            global: 10,
            categories: { 10: 5, 20: 3 },
            feeds: { 1: 2, 2: 3, 3: 5 },
          },
        });
      }),
    );
  });

  it("renders unread count for categories", async () => {
    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
    );

    // The unread count is now part of the link's accessible name in the grid
    expect(
      await screen.findByRole("link", { name: /tech 5 unread items/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /design 3 unread items/i }),
    ).toBeInTheDocument();
  });

  it("renders unread count for individual subscriptions", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
    );

    // Open Tech category to see Tech Feed
    const techFolder = await screen.findByRole("link", {
      name: /tech 5 unread items/i,
    });
    await user.click(techFolder);

    // Tech Feed (ID 1) should have 2 unread
    expect(
      await screen.findByRole("link", { name: /tech feed 2 unread items/i }),
    ).toBeInTheDocument();

    // Uncategorized Feed (ID 3) should have 5 unread
    expect(
      screen.getByRole("link", { name: /uncategorized feed 5 unread items/i }),
    ).toBeInTheDocument();
  });

  it("renders subscriptions grouped by categories", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
    );

    // Categories should be visible as links
    const techFolder = await screen.findByRole("link", {
      name: /tech 5 unread items/i,
    });
    expect(techFolder).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /design 3 unread items/i }),
    ).toBeInTheDocument();

    // Clicking the category row now both navigates and toggles the list
    await user.click(techFolder);
    expect(await screen.findByText(/tech feed/i)).toBeInTheDocument();
  });

  it("renders uncategorized subscriptions at the root level", async () => {
    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
    );

    expect(await screen.findByText(/uncategorized feed/i)).toBeInTheDocument();
  });

  it("handles empty categories by showing 'No feeds' message", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: [createMockCategory({ id: 30, name: "Empty Category" })],
        });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: {
            global: 0,
            categories: { 30: 0 },
            feeds: {},
          },
        });
      }),
    );

    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
    );

    const emptyFolder = await screen.findByRole("link", {
      name: /empty category/i,
    });
    await user.click(emptyFolder);
    expect(await screen.findByText(/no feeds/i)).toBeInTheDocument();
  });

  it("highlights the active feed and opens its category collapsible", async () => {
    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
      {
        searchParams: { feedId: "1" }, // Tech Feed
      },
    );

    const link = await screen.findByRole("link", { name: /tech feed 2/i });
    expect(link).toHaveAttribute("data-active", "true");

    // The parent collapsible should be open automatically
    const techLink = screen.getByRole("link", { name: /tech 5 unread items/i });
    const collapsible = techLink.closest('[data-slot="collapsible"]');
    expect(collapsible).toHaveAttribute("data-state", "open");
  });

  it("shows 'No subscriptions yet.' when both categories and subscriptions are empty", async () => {
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    render(
      <SidebarProvider>
        <SidebarFeeds />
      </SidebarProvider>,
    );

    expect(await screen.findByText(/no feeds yet/i)).toBeInTheDocument();
  });
});
