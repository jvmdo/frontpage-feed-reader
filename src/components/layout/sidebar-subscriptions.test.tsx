import { HttpResponse, http } from "msw";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
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
    );
  });

  it("renders subscriptions grouped by categories", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    // Categories should be visible as folder buttons
    const techFolder = await screen.findByRole("button", { name: /^tech$/i });
    expect(techFolder).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^design$/i })).toBeInTheDocument();

    // Feeds inside categories are in the DOM but might be hidden by Collapsible.
    // RTL's getByText finds them even if hidden unless we use { visible: true }.
    // However, wait for them to be present.
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

    const emptyFolder = await screen.findByRole("button", { name: /empty category/i });
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
    const subButton = link.closest('[data-slot="sidebar-menu-sub-button"]');
    expect(subButton).toHaveAttribute("data-active", "true");

    // The parent collapsible should be open automatically
    const collapsible = screen
      .getByRole("button", { name: /^tech$/i })
      .closest('[data-slot="collapsible"]');
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

    expect(await screen.findByText(/no subscriptions yet/i)).toBeInTheDocument();
  });
});
