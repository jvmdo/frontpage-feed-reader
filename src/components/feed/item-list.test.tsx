/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { RssIcon } from "lucide-react";
import { delay, HttpResponse, http } from "msw";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { vi } from "vitest";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { PAGINATION_LIMIT } from "@/lib/constants";
import { createMockItemWithSource } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import type { ItemWithSource } from "@/types";
import { ItemList } from "./item-list";
import ItemListSkeleton from "./item-list-skeleton";

// Control tour state in tests
const mockTourState = { isTourActive: false };

vi.mock("@/hooks/ui/use-tour-store", () => ({
  useTourStore: () => mockTourState,
}));

// Mock react-virtuoso to render items normally in JSDOM
vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, itemContent, components, context }: any) => {
    return (
      <div data-testid="virtuoso-scroller">
        <div data-testid="virtuoso-item-list">
          {data.map((item: any, index: number) => (
            <div key={item.item?.id || index}>{itemContent(index, item)}</div>
          ))}
        </div>
        {components?.Footer && <components.Footer context={context} />}
      </div>
    );
  },
  VirtuosoGrid: ({ data, itemContent, components, context }: any) => {
    return (
      <div data-testid="virtuoso-grid-scroller">
        <div data-testid="virtuoso-item-grid">
          {data.map((item: any, index: number) => (
            <div key={item.item?.id || index}>{itemContent(index, item)}</div>
          ))}
        </div>
        {components?.Footer && <components.Footer context={context} />}
      </div>
    );
  },
}));

const generateMockItems = (count: number, startId = 1): ItemWithSource[] => {
  return Array.from({ length: count }).map((_, i) =>
    createMockItemWithSource({
      item: {
        id: startId + i,
        title: `Test Item ${startId + i}`,
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
        <Suspense fallback={<ItemListSkeleton />}>{children}</Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

describe("ItemList", () => {
  beforeEach(() => {
    mockTourState.isTourActive = false;
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json([]);
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json([]);
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({ global: 0, categories: {}, feeds: {} });
      }),
    );
  });

  test("renders loading skeletons while fetching", async () => {
    server.use(
      http.get("/api/items", async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
    );

    const loadingStatus = screen.getByRole("status");

    expect(loadingStatus).toBeInTheDocument();
    expect(loadingStatus).toHaveTextContent(/loading items/i);
  });

  test("renders list of items when fetch is successful", async () => {
    server.use(
      http.get("/api/items", ({ request }) => {
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
        <ItemList />
      </TestWrapper>,
    );

    const itemCard = await screen.findByRole("article", {
      name: /test item 1\b/i,
    });

    expect(itemCard).toBeInTheDocument();
    expect(itemCard).toHaveTextContent(/description 1\b/i);
    expect(itemCard).toHaveTextContent(/example feed/i);
  });

  test("renders empty state when no items are returned", async () => {
    server.use(
      http.get("/api/items", () => {
        return HttpResponse.json([]);
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
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
      http.get("/api/items", () => {
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
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
      http.get("/api/items", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
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

  test("switches to grid layout when requested", async () => {
    server.use(
      http.get("/api/items", () => HttpResponse.json(mockItems.slice(0, 1))),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
      { searchParams: { layout: "grid" } },
    );

    // Verify grid scroller is used instead of list scroller
    expect(
      await screen.findByTestId("virtuoso-grid-scroller"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso-scroller")).not.toBeInTheDocument();
  });

  test("disables virtualization when tour is active", async () => {
    mockTourState.isTourActive = true;
    server.use(
      http.get("/api/items", () => HttpResponse.json(mockItems.slice(0, 5))),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
    );

    // In tour mode, it renders a plain div, not Virtuoso
    expect(
      await screen.findByRole("article", { name: /test item 1\b/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso-scroller")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("virtuoso-grid-scroller"),
    ).not.toBeInTheDocument();
  });
});
