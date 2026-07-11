import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { RefreshTaskStatusBanner } from "./refresh-task-status-banner";

describe("RefreshTaskStatusBanner", () => {
  const healthySystemStatus = {
    active: true,
    isFailing: false,
    lastRunAt: "2026-01-01T12:00:00Z",
    nextRunAt: "2026-01-01T12:05:00Z",
  };

  const setupMock = (systemStatus = healthySystemStatus, status = 200) => {
    server.use(
      http.get("/api/refresh-task-status", () => {
        if (status !== 200) {
          return new HttpResponse(null, { status });
        }
        return HttpResponse.json({ success: true, data: systemStatus });
      }),
    );
  };

  it("shows healthy status when the engine is active and not failing", async () => {
    setupMock(healthySystemStatus);
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <RefreshTaskStatusBanner />
      </Suspense>,
    );

    expect(
      await screen.findByText(/background engine healthy/i),
    ).toBeInTheDocument();
  });

  it("shows offline status when the engine is failing", async () => {
    setupMock({ ...healthySystemStatus, isFailing: true });
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <RefreshTaskStatusBanner />
      </Suspense>,
    );

    expect(
      await screen.findByText(/background engine offline/i),
    ).toBeInTheDocument();
  });

  it("shows offline status when the engine is inactive", async () => {
    setupMock({ ...healthySystemStatus, active: false });
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <RefreshTaskStatusBanner />
      </Suspense>,
    );

    expect(
      await screen.findByText(/background engine offline/i),
    ).toBeInTheDocument();
  });

  it("shows offline UI when API fails and recovers on retry", async () => {
    // Suppress React ErrorBoundary console output for cleaner test logs
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    setupMock(healthySystemStatus, 500);
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <RefreshTaskStatusBanner />
      </Suspense>,
    );

    expect(
      await screen.findByText(/sync telemetry offline/i),
    ).toBeInTheDocument();

    setupMock(healthySystemStatus, 200);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    const user = userEvent.setup();
    await user.click(retryButton);

    expect(
      await screen.findByText(/background engine healthy/i),
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
