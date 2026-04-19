import { HttpResponse, http } from "msw";
import { vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createMockFeedWithSubscription } from "@/tests/factories";
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

const mockSubscriptions = [
  createMockFeedWithSubscription({
    feed: { id: 1, title: "Feed 1", iconUrl: "https://feed1.com/icon.png" },
    subscription: { customTitle: "My Custom Feed 1" },
  }),
  createMockFeedWithSubscription({
    feed: { id: 2, title: "Feed 2" },
  }),
];

describe("SidebarSubscriptions", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: mockSubscriptions });
      }),
    );
  });

  it("renders all subscription items with correct titles", async () => {
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    expect(await screen.findByText(/my custom feed 1/i)).toBeInTheDocument();
    expect(screen.getByText(/feed 2/i)).toBeInTheDocument();
  });

  it("highlights the active feed based on the feedId query parameter", async () => {
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
      {
        searchParams: { feedId: "1" },
      },
    );

    const link1 = await screen.findByRole("link", {
      name: /my custom feed 1/i,
    });
    const button1 = link1.closest('[data-slot="sidebar-menu-button"]');
    expect(button1).toHaveAttribute("data-active", "true");

    const link2 = screen.getByRole("link", { name: /feed 2/i });
    const button2 = link2.closest('[data-slot="sidebar-menu-button"]');
    expect(button2).toHaveAttribute("data-active", "false");
  });

  it("shows the pending indicator when navigation is occurring", async () => {
    const { useLinkStatus } = await import("next/link");
    vi.mocked(useLinkStatus).mockReturnValue({ pending: true });

    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    // We check for the presence of the indicator in the links
    // LinkPendingIndicator is a span with animate-pulse
    const links = await screen.findAllByRole("link");
    for (const link of links) {
      // The indicator is a child of the link
      const indicator = link.querySelector(".animate-pulse");
      expect(indicator).toBeInTheDocument();
    }
  });

  it("renders correctly without an iconUrl (using fallback)", async () => {
    render(
      <SidebarProvider>
        <SidebarSubscriptions />
      </SidebarProvider>,
    );

    const feed2Item = await screen.findByText(/feed 2/i);
    expect(feed2Item).toBeInTheDocument();
  });
});
