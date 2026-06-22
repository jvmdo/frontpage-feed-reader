import userEvent from "@testing-library/user-event";
import { subDays, subMinutes } from "date-fns";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { vi } from "vitest";
import { refreshFeedAction } from "@/actions/feed/refresh-feed-action";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor, within } from "@/tests/rtl-utils";
import type { FeedWithSubscription } from "@/types";
import { FeedTable } from "./feed-table";

// Mock the refresh server action
vi.mock("@/actions/feed/refresh-feed-action", () => ({
  refreshFeedAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCategories = [
  createMockCategory({ id: 1, name: "Tech" }),
  createMockCategory({ id: 2, name: "Design" }),
];

const mockData: FeedWithSubscription[] = [
  createMockFeedWithSubscription({
    subscription: { id: 1, customTitle: "My Custom Title", categoryId: 1 },
    feed: {
      title: "Original Title 1",
      lastSuccessAt: subMinutes(new Date(), 5),
      healthStatus: "healthy",
    },
  }),
  createMockFeedWithSubscription({
    subscription: { id: 2, categoryId: 2 },
    feed: {
      title: "Feed Title 2",
      lastSuccessAt: subDays(new Date(), 2),
      healthStatus: "stale",
    },
  }),
  createMockFeedWithSubscription({
    subscription: { id: 3, categoryId: null },
    feed: {
      lastSuccessAt: subDays(new Date(), 5),
      healthStatus: "error",
    },
  }),
];

describe("FeedTable", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: mockCategories });
      }),
    );
  });

  it("renders correct table headers", async () => {
    render(<FeedTable data={mockData} />);

    expect(
      await screen.findByRole("columnheader", { name: /status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /title/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /url/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /category/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /last fetched/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /actions/i }),
    ).toBeInTheDocument();
  });

  it("renders correct category names and badges", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText("Tech")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("renders custom title when provided, otherwise feed title", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText("My Custom Title")).toBeInTheDocument();
    expect(screen.queryByText("Original Title 1")).not.toBeInTheDocument();
    expect(screen.getByText("Feed Title 2")).toBeInTheDocument();
  });

  it("renders various health statuses correctly", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText(/healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/stale/i)).toBeInTheDocument();
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it("renders relative timestamps for last success", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText(/5 minutes ago/i)).toBeInTheDocument();
    expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
  });

  it("renders 'Never' when lastSuccessAt is null", async () => {
    const dataWithNullSuccess: FeedWithSubscription[] = [
      {
        ...mockData[0],
        feed: { ...mockData[0].feed, lastSuccessAt: null },
      },
    ];
    render(<FeedTable data={dataWithNullSuccess} />);

    expect(await screen.findByText(/never/i)).toBeInTheDocument();
  });

  it("displays loading state while refreshing feed and resolves successfully", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = Promise.withResolvers<any>();

    vi.mocked(refreshFeedAction).mockReturnValue(promise);

    render(<FeedTable data={mockData} />);

    // Wait for suspense to resolve
    await screen.findByText("My Custom Title");

    // 1. Find the first feed row
    const rows = screen.getAllByRole("row");
    const firstRow = rows[1];

    // 2. Open the action menu for the first feed
    const actionButton = within(firstRow).getByRole("button", {
      name: /open menu/i,
    });
    await user.click(actionButton);

    // 3. Click the refresh button
    const refreshButton = await screen.findByRole("menuitem", {
      name: /refresh/i,
    });
    await user.click(refreshButton);

    // 4. Verify it calls refreshFeedAction
    expect(refreshFeedAction).toHaveBeenCalledWith({
      scope: "feed",
      id: mockData[0].feed.id,
    });

    // 5. Verify the row shows the loading status (accessible live region)
    const statusEl = within(firstRow).getByRole("status");
    expect(statusEl).toHaveTextContent(/refreshing feed/i);

    // 5. Resolve the promise
    resolve({ success: true, data: mockData[0] });

    // 6. Verify loading state is removed (status is empty) and success toast is shown
    await waitFor(() => {
      expect(statusEl).toHaveTextContent("");
      expect(toast.success).toHaveBeenCalledWith("Feed refreshed");
    });
  });

  it("displays loading state while refreshing feed and handles errors successfully", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = Promise.withResolvers<any>();

    vi.mocked(refreshFeedAction).mockReturnValue(promise);

    render(<FeedTable data={mockData} />);

    // Wait for suspense to resolve
    await screen.findByText("My Custom Title");

    // 1. Find the first feed row
    const rows = screen.getAllByRole("row");
    const firstRow = rows[1];

    // 2. Open the action menu for the first feed
    const actionButton = within(firstRow).getByRole("button", {
      name: /open menu/i,
    });
    await user.click(actionButton);

    // 3. Click the refresh button
    const refreshButton = await screen.findByRole("menuitem", {
      name: /refresh/i,
    });
    await user.click(refreshButton);

    // Verify the row shows the loading status (accessible live region)
    const statusEl = within(firstRow).getByRole("status");
    expect(statusEl).toHaveTextContent(/refreshing feed/i);

    // 4. Resolve the promise with an error
    resolve({ success: false, error: "Failed to fetch XML feed" });

    // 5. Verify loading state is removed (status is empty) and error toast is shown
    await waitFor(() => {
      expect(statusEl).toHaveTextContent("");
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch XML feed");
    });
  });
});
