import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockListItemWithSource } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { NewItemsBanner } from "./new-items-banner";

describe("NewItemsBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.get("/api/items", () => {
        return HttpResponse.json([
          createMockListItemWithSource({
            item: { publishedAt: new Date("2026-07-17T22:00:00.000Z") },
          }),
        ]);
      }),
    );
  });

  it("renders banner when new items exist and hides banner when user clicks to load them", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/feeds/check-new", () => {
        return HttpResponse.json({ count: 3 });
      }),
    );

    render(
      <Suspense fallback={null}>
        <NewItemsBanner />
      </Suspense>,
    );

    const bannerButton = await screen.findByRole("button", {
      name: /3 new items available/i,
    });
    expect(bannerButton).toBeInTheDocument();

    await user.click(bannerButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /new items available/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("does not display banner when no new items exist", async () => {
    server.use(
      http.get("/api/feeds/check-new", () => {
        return HttpResponse.json({ count: 0 });
      }),
    );

    render(
      <Suspense fallback={null}>
        <NewItemsBanner />
      </Suspense>,
    );

    expect(
      screen.queryByRole("button", { name: /new items available/i }),
    ).not.toBeInTheDocument();
  });
});
