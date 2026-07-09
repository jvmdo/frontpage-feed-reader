import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { FeedManager } from "./feed-manager";

describe("FeedManager", () => {
  const setupMocks = (feedsData: any[] = []) => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: feedsData,
        });
      }),
      http.get("/api/refresh-task-status", () => {
        return HttpResponse.json({
          success: true,
          data: {
            active: true,
            isFailing: false,
            lastRunAt: "2026-01-01T12:00:00Z",
            nextRunAt: "2026-01-01T12:05:00Z",
          },
        });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: [],
        });
      }),
    );
  };

  it("shows empty state when there are no subscriptions", async () => {
    setupMocks([]);
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <FeedManager />
      </Suspense>,
    );

    expect(await screen.findByText(/no feeds yet/i)).toBeInTheDocument();

    // queryAllByText because 'Add your first feed' might match multiple nested elements
    const buttons = screen.queryAllByText(/add your first feed/i);
    expect(buttons.length).toBeGreaterThan(0);

    expect(screen.queryByText(/background engine/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows table and status banner when there are subscriptions", async () => {
    const mockFeed = createMockFeedWithSubscription();
    setupMocks([mockFeed]);
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <FeedManager />
      </Suspense>,
    );

    expect(
      await screen.findByText(/background engine healthy/i),
    ).toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/Mock Feed/i)).toBeInTheDocument();

    expect(screen.queryByText(/no feeds yet/i)).not.toBeInTheDocument();
  });
});
