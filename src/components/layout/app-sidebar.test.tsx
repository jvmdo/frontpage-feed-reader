import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addFeedAction } from "@/actions/feed/add-feed-action";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import type { Category, FeedWithSubscription } from "@/types";
import { AppSidebar } from "./app-sidebar";
import { SidebarFeeds } from "./components/sidebar-feeds";

// Mock next/navigation's usePathname
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

// Mock the server actions
vi.mock("@/actions/feed/add-feed-action", () => ({
  addFeedAction: vi.fn(),
}));

vi.mock("@/actions/feed/remove-feed-action", () => ({
  removeFeedAction: vi.fn(),
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AppSidebar Integration", () => {
  let mockSubscriptions: FeedWithSubscription[];
  let mockCategories: Category[];

  beforeEach(() => {
    // Initial state for MSW
    mockSubscriptions = [
      createMockFeedWithSubscription({
        feed: { id: 1, title: "Initial Feed" },
        subscription: {
          id: 1,
          customTitle: "My Custom Feed 1",
          categoryId: null,
        },
      }),
      createMockFeedWithSubscription({
        feed: { id: 2, title: "Categorized Feed" },
        subscription: { id: 2, customTitle: "My Tech Feed", categoryId: 10 },
      }),
    ];

    mockCategories = [createMockCategory({ id: 10, name: "Tech" })];

    // Mock GET handlers
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json(mockSubscriptions);
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json(mockCategories);
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          global: 42,
          categories: { "10": 0 },
          feeds: { "1": 0, "2": 0 },
        });
      }),
    );
  });

  it("displays the global unread count from the API", async () => {
    render(
      <SidebarProvider>
        <AppSidebar>
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarFeeds />
          </Suspense>
        </AppSidebar>
      </SidebarProvider>,
    );

    // Find the badge containing the global unread count
    const allItemsBadge = await screen.findByText("42");
    expect(allItemsBadge).toBeInTheDocument();
  });

  it("updates the subscription list when a new feed is added", async () => {
    const user = userEvent.setup();

    // Mock successful addFeedAction
    vi.mocked(addFeedAction).mockImplementation(async () => {
      const newSub = createMockFeedWithSubscription({
        feed: { id: 3, title: "New Feed" },
      });

      // Update mockSubscriptions to simulate backend change
      mockSubscriptions = [...mockSubscriptions, newSub];

      return { success: true };
    });

    // Mock verification to succeed
    server.use(
      http.get("/api/feeds/verify", () => {
        return HttpResponse.json({
          success: true,
          alreadySubscribed: false,
          feed: {
            title: "New Feed",
            description: "New Description",
            iconUrl: null,
          },
        });
      }),
    );

    render(
      <SidebarProvider>
        <AppSidebar>
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarFeeds />
          </Suspense>
        </AppSidebar>
      </SidebarProvider>,
    );

    // Verify initial state
    expect(await screen.findByText(/my custom feed 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/new feed/i)).not.toBeInTheDocument();

    // Open the Add Feed dialog
    const addFeedButton = screen.getByRole("button", { name: /add feed/i });
    await user.click(addFeedButton);

    // Fill the form and verify, then submit
    const urlInput = screen.getByLabelText(/feed url/i);
    await user.type(urlInput, "https://newfeed.com");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    const submitButton = await screen.findByRole("button", { name: /add/i });
    await user.click(submitButton);

    // Verify that the new feed appears in the sidebar
    expect(await screen.findByText(/new feed/i)).toBeInTheDocument();
    expect(screen.getByText(/my custom feed 1/i)).toBeInTheDocument();
  });

  it("renders the health status in the footer", async () => {
    render(
      <SidebarProvider>
        <AppSidebar>
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarFeeds />
          </Suspense>
        </AppSidebar>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/all feeds healthy/i)).toBeInTheDocument();
  });

  describe("Active States", () => {
    it("highlights 'All Items' only when no filters are active", async () => {
      render(
        <SidebarProvider>
          <AppSidebar>
            <Suspense fallback={<div>Loading...</div>}>
              <SidebarFeeds />
            </Suspense>
          </AppSidebar>
        </SidebarProvider>,
      );

      const allItemsButton = await screen.findByRole("link", {
        name: /all items/i,
      });
      expect(allItemsButton).toHaveAttribute("data-active", "true");
    });

    it("highlights a category when categoryId filter is active", async () => {
      render(
        <SidebarProvider>
          <AppSidebar>
            <Suspense fallback={<div>Loading...</div>}>
              <SidebarFeeds />
            </Suspense>
          </AppSidebar>
        </SidebarProvider>,
        {
          searchParams: { categoryId: "10" },
        },
      );

      const allItemsButton = await screen.findByRole("link", {
        name: /all items/i,
      });
      expect(allItemsButton).toHaveAttribute("data-active", "false");

      // Use exact name to avoid matching "My Tech Feed"
      const categoryButton = await screen.findByRole("link", { name: "Tech" });
      expect(categoryButton).toHaveAttribute("data-active", "true");
    });

    it("highlights an individual feed when feedId filter is active", async () => {
      render(
        <SidebarProvider>
          <AppSidebar>
            <Suspense fallback={<div>Loading...</div>}>
              <SidebarFeeds />
            </Suspense>
          </AppSidebar>
        </SidebarProvider>,
        {
          searchParams: { feedId: "1" },
        },
      );

      const allItemsButton = await screen.findByRole("link", {
        name: /all items/i,
      });
      expect(allItemsButton).toHaveAttribute("data-active", "false");

      const feedButton = await screen.findByRole("link", {
        name: /my custom feed 1/i,
      });
      expect(feedButton).toHaveAttribute("data-active", "true");
    });
  });

  describe("Add Feed Dialog", () => {
    it("opens the dialog and displays the correct elements", async () => {
      const user = userEvent.setup();

      render(
        <SidebarProvider>
          <AppSidebar>
            <Suspense fallback={<div>Loading...</div>}>
              <SidebarFeeds />
            </Suspense>
          </AppSidebar>
        </SidebarProvider>,
      );

      const addFeedButton = await screen.findByRole("button", {
        name: /add feed/i,
      });

      await user.click(addFeedButton);

      // Verify dialog is open
      const dialog = await screen.findByRole("dialog");

      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /add feed/i }),
      ).toBeInTheDocument();

      // Verify input and verify button
      expect(screen.getByLabelText(/feed url/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /verify/i }),
      ).toBeInTheDocument();
    });
  });
});
