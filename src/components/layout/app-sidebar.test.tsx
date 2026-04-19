import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { vi } from "vitest";
import { addFeedAction } from "@/actions/feed/add-feed-action";
import { removeSubscriptionAction } from "@/actions/feed/remove-subscription-action";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRemoveSubscription } from "@/hooks/use-remove-subscription";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import type { FeedWithSubscription } from "@/types";
import { AppSidebar } from "./app-sidebar";
import { SidebarSubscriptions } from "./sidebar-subscriptions";

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

vi.mock("@/actions/feed/remove-subscription-action", () => ({
  removeSubscriptionAction: vi.fn(),
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper component to trigger deletion for testing cross-component reactivity
const DeleteTrigger = ({ id }: { id: number }) => {
  const { mutate: removeSubscription } = useRemoveSubscription();
  return (
    <button type="button" onClick={() => removeSubscription({ id })}>
      Delete {id}
    </button>
  );
};

describe("AppSidebar Integration", () => {
  let mockSubscriptions: FeedWithSubscription[];

  beforeEach(() => {
    // Initial subscriptions state for MSW
    mockSubscriptions = [
      createMockFeedWithSubscription({
        feed: { id: 1, title: "Initial Feed" },
        subscription: { id: 1, customTitle: "My Custom Feed 1" },
      }),
    ];

    // Mock GET /api/feeds/subscriptions
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: mockSubscriptions });
      }),
    );
  });

  it("updates the subscription list when a new feed is added", async () => {
    const user = userEvent.setup();

    // Mock successful addFeedAction
    vi.mocked(addFeedAction).mockImplementation(async () => {
      const newSub = createMockFeedWithSubscription({
        feed: { title: "New Feed" },
      });

      // Update mockSubscriptions to simulate backend change
      mockSubscriptions = [...mockSubscriptions, newSub];

      return { success: true, data: newSub };
    });

    render(
      <SidebarProvider>
        <AppSidebar>
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarSubscriptions />
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

    // Fill the form and submit
    const urlInput = screen.getByLabelText(/feed url/i);
    await user.type(urlInput, "https://newfeed.com");
    await user.click(screen.getByRole("button", { name: /add/i }));

    // Verify that the new feed appears in the sidebar
    expect(await screen.findByText(/new feed/i)).toBeInTheDocument();
    expect(screen.getByText(/my custom feed 1/i)).toBeInTheDocument();
  });

  it("updates the subscription list when a feed is removed", async () => {
    const user = userEvent.setup();

    // Mock successful removeSubscriptionAction
    vi.mocked(removeSubscriptionAction).mockImplementation(
      async (input: { id: number }) => {
        const deletedSub = mockSubscriptions.find(
          (s) => s.subscription.id === input.id,
        );

        if (!deletedSub) {
          return { success: false, error: "Not found", code: "NOT_FOUND" };
        }

        // Update mockSubscriptions to simulate backend change
        mockSubscriptions = mockSubscriptions.filter(
          (s) => s.subscription.id !== input.id,
        );

        return { success: true, data: deletedSub.subscription };
      },
    );

    render(
      <SidebarProvider>
        <AppSidebar>
          <Suspense fallback={<div>Loading...</div>}>
            <SidebarSubscriptions />
          </Suspense>
        </AppSidebar>
        <DeleteTrigger id={1} />
      </SidebarProvider>,
    );

    // Verify initial state
    expect(await screen.findByText(/my custom feed 1/i)).toBeInTheDocument();

    // Click the delete button
    await user.click(screen.getByRole("button", { name: /delete 1/i }));

    // Verify that the feed disappears from the sidebar
    await waitFor(() => {
      expect(screen.queryByText(/my custom feed 1/i)).not.toBeInTheDocument();
    });
  });
});
