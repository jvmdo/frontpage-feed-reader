/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Suspense } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { ActiveFilterChips } from "./active-filter-chips";
import { FeedMenu } from "./feed-menu";

vi.mock("@/hooks/ui/use-mobile", () => ({
  useIsMobile: vi.fn(),
}));

const CATEGORY_ID = 1;
const FEED_1_ID = 101;

describe("FeedMenu Integration", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  });

  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false); // default to desktop

    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: [createMockCategory({ id: CATEGORY_ID, name: "Tech" })],
        });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: [
            createMockFeedWithSubscription({
              feed: { id: FEED_1_ID, title: "Tech News 1" },
              subscription: { categoryId: CATEGORY_ID },
            }),
          ],
        });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: { global: 0, categories: {}, feeds: {} },
        });
      }),
    );
  });

  const setup = (searchParams: Record<string, string> = { saved: "true" }) => {
    const user = userEvent.setup();

    const utils = render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Loading...</div>}
      >
        <div id="feed-container">
          <FeedMenu>
            <button type="button">FeedMenuTrigger</button>
          </FeedMenu>
          <ActiveFilterChips />
        </div>
      </Suspense>,
      { searchParams },
    );

    return { ...utils, user };
  };

  it("can change the layout option via FeedMenu on desktop", async () => {
    const { user } = setup();

    const trigger = await screen.findByRole("button", {
      name: "FeedMenuTrigger",
    });
    await user.click(trigger);

    const layoutGridRadio = screen.getByRole("menuitemradio", {
      name: /^grid$/i,
    });
    await user.click(layoutGridRadio);

    expect(layoutGridRadio).toHaveAttribute("data-state", "checked");
  });

  it("can change the sort order via FeedMenu on desktop", async () => {
    const { user } = setup();

    const trigger = await screen.findByRole("button", {
      name: "FeedMenuTrigger",
    });
    await user.click(trigger);

    const oldestSavedRadio = screen.getByRole("menuitemradio", {
      name: /oldest saved/i,
    });
    await user.click(oldestSavedRadio);

    expect(oldestSavedRadio).toHaveAttribute("data-state", "checked");
  });

  it("mobile drawer wiring: clicking mobile checkboxes updates active filters", async () => {
    // Mock mobile device
    vi.mocked(useIsMobile).mockReturnValue(true);

    const { user } = setup();

    // 1. Wait for suspense and click FeedMenu
    const trigger = await screen.findByRole("button", {
      name: "FeedMenuTrigger",
    });
    await user.click(trigger);

    // 2. Open Mobile Filter Drawer (this is the MobileTrigger render prop from WithFeedFilters)
    await user.click(screen.getByRole("menuitem", { name: /^filter$/i }));

    // Wait for drawer to appear
    const drawerTitle = await screen.findByText("Filter Items");
    expect(drawerTitle).toBeInTheDocument();

    // 3. Find and click standard checkbox in the drawer
    const techNewsCheckbox = screen.getByRole("checkbox", {
      name: /tech news 1/i,
    });
    await user.click(techNewsCheckbox);

    // 4. Verify ActiveFilterChips rendered the chip
    expect(await screen.findByText(/Tech News 1/i)).toBeInTheDocument();
  });
});
