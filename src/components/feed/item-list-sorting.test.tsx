import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { server } from "@/tests/mocks/server";
import { render, waitFor } from "@/tests/rtl-utils";
import { ItemList } from "./item-list";
import ItemListSkeleton from "./item-list-skeleton";

// Mock react-virtuoso to render items normally in JSDOM
vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, itemContent }: any) => {
    return (
      <div data-testid="virtuoso-item-list">
        {data.map((item: any, index: number) => (
          <div key={item.item?.id || index}>{itemContent(index, item)}</div>
        ))}
      </div>
    );
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={() => (
          <EmptyState
            title={<h3>Something went wrong</h3>}
            description="Error"
            action={<Button>Try again</Button>}
          />
        )}
      >
        <Suspense fallback={<ItemListSkeleton />}>{children}</Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

describe("ItemList Sorting & Explicit Parameters", () => {
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

  test("requests items with default sorting (publishedAt, desc) when no URL parameters are present", async () => {
    let capturedUrl: URL | null = null;

    server.use(
      http.get("/api/items", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
    );

    await waitFor(() => expect(capturedUrl).not.toBeNull());
    expect(capturedUrl!.searchParams.get("sortBy")).toBe("publishedAt");
    expect(capturedUrl!.searchParams.get("sortOrder")).toBe("desc");
  });

  test("requests items with explicit sortBy=publishedAt and sortOrder=asc from URL", async () => {
    let capturedUrl: URL | null = null;

    server.use(
      http.get("/api/items", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
      {
        searchParams: { sortBy: "publishedAt", sortOrder: "asc" },
      },
    );

    await waitFor(() => expect(capturedUrl).not.toBeNull());
    expect(capturedUrl!.searchParams.get("sortBy")).toBe("publishedAt");
    expect(capturedUrl!.searchParams.get("sortOrder")).toBe("asc");
  });

  test("requests items with sortBy=bookmarkedAt when 'saved' view is active", async () => {
    let capturedUrl: URL | null = null;

    server.use(
      http.get("/api/items", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
      {
        searchParams: { saved: "true" },
      },
    );

    await waitFor(() => expect(capturedUrl).not.toBeNull());
    expect(capturedUrl!.searchParams.get("sortBy")).toBe("bookmarkedAt");
    expect(capturedUrl!.searchParams.get("saved")).toBe("true");
  });

  test("requests items with sortOrder=asc when 'sortOrder=asc' is in URL", async () => {
    let capturedUrl: URL | null = null;

    server.use(
      http.get("/api/items", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
      {
        searchParams: { sortOrder: "asc" },
      },
    );

    await waitFor(() => expect(capturedUrl).not.toBeNull());
    expect(capturedUrl!.searchParams.get("sortOrder")).toBe("asc");
    expect(capturedUrl!.searchParams.get("sortBy")).toBe("publishedAt");
  });

  test("combines filters and sorting correctly", async () => {
    let capturedUrl: URL | null = null;

    server.use(
      http.get("/api/items", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    render(
      <TestWrapper>
        <ItemList />
      </TestWrapper>,
      {
        searchParams: { saved: "true", sortOrder: "asc" },
      },
    );

    await waitFor(() => expect(capturedUrl).not.toBeNull());
    expect(capturedUrl!.searchParams.get("sortBy")).toBe("bookmarkedAt");
    expect(capturedUrl!.searchParams.get("sortOrder")).toBe("asc");
    expect(capturedUrl!.searchParams.get("saved")).toBe("true");
  });
});
