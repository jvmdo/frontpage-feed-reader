import { QueryErrorResetBoundary } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { RssIcon } from "lucide-react";
import { delay, HttpResponse, http } from "msw";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { vi } from "vitest";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { PAGINATION_LIMIT } from "@/lib/constants";
import { createMockFeedItemWithSource } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import type { FeedItemWithSource } from "@/types";
import { FeedItemList } from "./feed-item-list";
import FeedItemListSkeleton from "./feed-item-list-skeleton";

// Mock react-virtuoso to render items normally in JSDOM
vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, itemContent, endReached, components }: any) => {
    return (
      <div data-testid="virtuoso-scroller">
        <div data-testid="virtuoso-item-list">
          {data.map((item: any, index: number) => (
            <div key={item.item?.id || index}>{itemContent(index, item)}</div>
          ))}
        </div>
        {components?.Footer && <components.Footer />}
        <button
          data-testid="virtuoso-end-reached-trigger"
          onClick={endReached}
          onKeyDown={(e: React.KeyboardEvent) =>
            e.key === "Enter" && endReached()
          }
          style={{ height: 1, width: 1 }}
          type="button"
        />
      </div>
    );
  },
}));

const generateMockItems = (
  count: number,
  startId = 1,
): FeedItemWithSource[] => {
  return Array.from({ length: count }).map((_, i) =>
    createMockFeedItemWithSource({
      item: {
        id: startId + i,
        title: `Test Article ${startId + i}`,
        description: `Description ${startId + i}`,
      },
      feed: {
        title: "Example Feed",
      },
    }),
  );
};

const mockItems = generateMockItems(PAGINATION_LIMIT * 2 + 5);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ resetErrorBoundary }) => (
          <EmptyState
            title={<h3>Something went wrong</h3>}
            description="We couldn't load your feed items. Please try refreshing the page."
            icon={RssIcon}
            action={
              <Button onClick={() => resetErrorBoundary()}>Try again</Button>
            }
          />
        )}
      >
        <Suspense fallback={<FeedItemListSkeleton />}>{children}</Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

describe("FeedItemList", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: { global: 0, categories: {}, feeds: {} },
        });
      }),
    );
  });

  test("renders loading skeletons while fetching", async () => {
    server.use(
      http.get("/api/feeds/items", async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const loadingStatus = screen.getByRole("status");

    expect(loadingStatus).toBeInTheDocument();
    expect(loadingStatus).toHaveTextContent(/loading feed items/i);
  });

  test("renders list of items when fetch is successful", async () => {
    server.use(
      http.get("/api/feeds/items", ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get("offset") || "0");
        const limit = Number(
          url.searchParams.get("limit") || String(PAGINATION_LIMIT),
        );

        return HttpResponse.json(mockItems.slice(offset, offset + limit));
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const itemCard = await screen.findByRole("article", {
      name: /test article 1\b/i,
    });

    expect(itemCard).toBeInTheDocument();
    expect(itemCard).toHaveTextContent(/description 1\b/i);
    expect(itemCard).toHaveTextContent(/example feed/i);
  });

  test("loads more items when scrolling to the bottom", async () => {
    server.use(
      http.get("/api/feeds/items", ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get("offset") || "0");
        const limit = Number(
          url.searchParams.get("limit") || String(PAGINATION_LIMIT),
        );

        return HttpResponse.json(mockItems.slice(offset, offset + limit));
      }),
    );

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const firstItemTitle = /test article 1\b/i;
    const nextItemTitle = new RegExp(
      `test article ${PAGINATION_LIMIT + 1}\\b`,
      "i",
    );

    // Wait for the first page to load
    await screen.findByRole("heading", { name: firstItemTitle });

    expect(
      screen.queryByRole("heading", { name: nextItemTitle }),
    ).not.toBeInTheDocument();

    // Trigger endReached via our mock's sentinel using userEvent
    await user.click(screen.getByTestId("virtuoso-end-reached-trigger"));

    // Wait for the second page to load
    await screen.findByRole("heading", { name: nextItemTitle });

    expect(
      screen.getByRole("heading", { name: firstItemTitle }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: nextItemTitle }),
    ).toBeInTheDocument();
  });

  test("renders empty state when no items are returned", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return HttpResponse.json([]);
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const emptyTitle = await screen.findByRole("heading", {
      name: /your feed is empty/i,
    });

    expect(emptyTitle).toBeInTheDocument();
    expect(screen.getByText(/subscribe to more feeds/i)).toBeInTheDocument();
  });

  test("renders category-specific empty state when categoryId is active", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
      {
        searchParams: { categoryId: "10" },
      },
    );

    // Matching the actual heading in the UI
    const emptyTitle = await screen.findByRole("heading", {
      name: /this category has no items yet/i,
    });

    expect(emptyTitle).toBeInTheDocument();

    expect(
      screen.getByText(/assign feeds to this category/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /assign feeds/i }),
    ).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const errorTitle = await screen.findByRole("heading", {
      name: /something went wrong/i,
    });

    expect(errorTitle).toBeInTheDocument();

    expect(
      screen.getByText(/we couldn't load your feed items/i),
    ).toBeInTheDocument();
  });
});
