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
import { SidebarSubscriptions } from "./sidebar-subscriptions";

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

describe("SidebarSubscriptions", () => {
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

  it("renders unread count badges for categories", async () => {
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    // Category 10 (Tech) should have 5 unread items
    const techFolder = await screen.findByRole("link", { name: /^tech$/i });
    const techItem = techFolder.closest('[data-sidebar="menu-item"]');
    expect(techItem).toHaveTextContent("5");

    // Category 20 (Design) should have 3 unread items
    const designFolder = screen.getByRole("link", { name: /^design$/i });
    const designItem = designFolder.closest('[data-sidebar="menu-item"]');
    expect(designItem).toHaveTextContent("3");
  });

  it("renders unread count badges for individual subscriptions", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    // Open Tech category to see Tech Feed
    const techFolder = await screen.findByRole("link", { name: /^tech$/i });
    await user.click(techFolder);

    // Tech Feed (ID 1) should have 2 unread
    const techFeedLink = await screen.findByRole("link", { name: /tech feed/i });
    const techFeedItem = techFeedLink.closest('[data-sidebar="menu-sub-item"]');
    expect(techFeedItem).toHaveTextContent("2");

    // Uncategorized Feed (ID 3) should have 5 unread
    const uncatFeedLink = screen.getByRole("link", {
      name: /uncategorized feed/i,
    });
    const uncatFeedItem = uncatFeedLink.closest('[data-sidebar="menu-item"]');
    expect(uncatFeedItem).toHaveTextContent("5");
  });

  it("renders subscriptions grouped by categories", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    // Categories should be visible as links
    const techFolder = await screen.findByRole("link", { name: /^tech$/i });
    expect(techFolder).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^design$/i })).toBeInTheDocument();

    // Clicking the category row now both navigates and toggles the list
    await user.click(techFolder);
    expect(await screen.findByText(/tech feed/i)).toBeInTheDocument();
  });

  it("renders uncategorized subscriptions at the root level", async () => {
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
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
    );

    render(
      <SidebarProvider>
        <SidebarSubscriptions />
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
        <SidebarSubscriptions />
      </SidebarProvider>,
      {
        searchParams: { feedId: "1" }, // Tech Feed
      },
    );

    const link = await screen.findByRole("link", { name: /tech feed/i });
    expect(link).toHaveAttribute("data-active", "true");

    // The parent collapsible should be open automatically
    const techLink = screen.getByRole("link", { name: /^tech$/i });
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
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    expect(
      await screen.findByText(/no subscriptions yet/i),
    ).toBeInTheDocument();
  });
});
