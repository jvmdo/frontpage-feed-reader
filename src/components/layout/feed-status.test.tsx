import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { FeedStatus } from "./feed-status";

describe("FeedStatus", () => {
  it("renders 'All feeds healthy' when all feeds are healthy", async () => {
    server.use(
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
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/all feeds healthy/i)).toBeInTheDocument();
  });

  it("shows error status when feeds have errors", async () => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: [
            createMockFeedWithSubscription({
              feed: { healthStatus: "error" },
            }),
            createMockFeedWithSubscription({
              feed: { healthStatus: "stale" },
            }),
            createMockFeedWithSubscription({
              feed: { healthStatus: "healthy" },
            }),
          ],
        });
      }),
    );

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
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: [
            createMockFeedWithSubscription({
              feed: { healthStatus: "stale" },
            }),
            createMockFeedWithSubscription({
              feed: { healthStatus: "healthy" },
            }),
          ],
        });
      }),
    );

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
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    render(
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <FeedStatus />
        </Suspense>
      </SidebarProvider>,
    );

    expect(await screen.findByText(/manage feeds/i)).toBeInTheDocument();
  });

  it("allows extending status logic with custom rules (OCP)", async () => {
    const customRules = [
      {
        predicate: () => true,
        resolve: () => ({
          label: "Custom Status",
          icon: () => <span data-testid="custom-icon" />,
        }),
      },
    ];

    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

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
});
