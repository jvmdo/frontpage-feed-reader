import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { vi } from "vitest";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { FeedStatus, FeedStatusErrorFallback } from "./feed-status";

describe("FeedStatus", () => {
  const healthySystemStatus = {
    active: true,
    isFailing: false,
    lastRunAt: "2026-01-01T12:00:00Z",
    nextRunAt: "2026-01-01T12:05:00Z",
  };

  const setupMocks = (
    systemStatus = healthySystemStatus,
    feedsData: any[] = [],
  ) => {
    server.use(
      http.get("/api/refresh-task-status", () => {
        return HttpResponse.json({ success: true, data: systemStatus });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: feedsData,
        });
      }),
    );
  };

  it("renders 'All feeds healthy' when all feeds are healthy and system is healthy", async () => {
    setupMocks(healthySystemStatus, [
      createMockFeedWithSubscription({ feed: { healthStatus: "healthy" } }),
    ]);

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/all feeds healthy/i)).toBeInTheDocument();
  });

  it("shows error status when feeds have errors", async () => {
    setupMocks(healthySystemStatus, [
      createMockFeedWithSubscription({ feed: { healthStatus: "error" } }),
      createMockFeedWithSubscription({ feed: { healthStatus: "stale" } }),
      createMockFeedWithSubscription({ feed: { healthStatus: "healthy" } }),
    ]);

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/1 feed has errors/i)).toBeInTheDocument();
  });

  it("shows stale status when feeds are stale and none have errors", async () => {
    setupMocks(healthySystemStatus, [
      createMockFeedWithSubscription({ feed: { healthStatus: "stale" } }),
      createMockFeedWithSubscription({ feed: { healthStatus: "healthy" } }),
    ]);

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/1 feed is stale/i)).toBeInTheDocument();
  });

  it("shows 'Manage feeds' when there are no subscriptions", async () => {
    setupMocks(healthySystemStatus, []);

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/manage feeds/i)).toBeInTheDocument();
  });

  it("shows 'Sync engine paused' when system task is inactive", async () => {
    setupMocks({ ...healthySystemStatus, active: false }, [
      createMockFeedWithSubscription({ feed: { healthStatus: "healthy" } }),
    ]);

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/sync engine paused/i)).toBeInTheDocument();
  });

  it("shows 'Sync engine failing' when system task is failing", async () => {
    setupMocks({ ...healthySystemStatus, isFailing: true }, [
      createMockFeedWithSubscription({ feed: { healthStatus: "healthy" } }),
    ]);

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/sync engine failing/i)).toBeInTheDocument();
  });

  it("gives precedence to system failure over feed errors", async () => {
    setupMocks(
      { ...healthySystemStatus, isFailing: true }, // Engine is failing
      [createMockFeedWithSubscription({ feed: { healthStatus: "error" } })], // Feed also has an error
    );

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    // System failure should be shown because it's the first rule in DEFAULT_RULES
    expect(await screen.findByText(/sync engine failing/i)).toBeInTheDocument();
  });

  it("allows extending status logic with custom rules (OCP)", async () => {
    setupMocks(healthySystemStatus, []);

    const customRules = [
      {
        predicate: () => true,
        resolve: () => ({
          label: "Custom Status",
          icon: () => <span data-testid="custom-icon" />,
        }),
      },
    ];

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus rules={customRules as any} />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/custom status/i)).toBeInTheDocument();
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  describe("Error handling", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders status offline fallback when query fails and recovers on retry", async () => {
      let callCount = 0;
      setupMocks(); // Set up standard mocks first, then override

      server.use(
        http.get("/api/refresh-task-status", () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json({
            success: true,
            data: healthySystemStatus,
          });
        }),
        http.get("/api/feeds/subscriptions", () => {
          return HttpResponse.json({
            success: true,
            data: [
              createMockFeedWithSubscription({
                feed: { healthStatus: "healthy" },
              }),
            ],
          });
        }),
      );

      render(
        <SidebarProvider>
          <QueryErrorBoundary fallback={<FeedStatusErrorFallback />}>
            <Suspense fallback={<div>Loading...</div>}>
              <FeedStatus />
            </Suspense>
          </QueryErrorBoundary>
        </SidebarProvider>,
      );

      const retryButton = await screen.findByRole("button", {
        name: /status offline \(retry\)/i,
      });
      expect(retryButton).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(retryButton);

      expect(await screen.findByText(/all feeds healthy/i)).toBeInTheDocument();
    });
  });
});
