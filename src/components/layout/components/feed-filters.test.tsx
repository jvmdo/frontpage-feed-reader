/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/rtl-utils";
import { ActiveFilterChips } from "./active-filter-chips";
import { FilterDropdown } from "./filter-dropdown";

const CATEGORY_ID = 1;
const FEED_1_ID = 101;
const FEED_2_ID = 102;
const OTHER_FEED_ID = 201;

const mockCategories = [
  { id: CATEGORY_ID, name: "Tech", color: "#ff0000" },
  { id: 2, name: "Empty Cat", color: "#00ff00" },
];

const mockFeeds = [
  {
    feed: { id: FEED_1_ID, title: "Tech News 1", iconUrl: "icon1.png" },
    subscription: { categoryId: CATEGORY_ID },
  },
  {
    feed: { id: FEED_2_ID, title: "Tech News 2", iconUrl: "icon2.png" },
    subscription: { categoryId: CATEGORY_ID },
  },
  {
    feed: { id: OTHER_FEED_ID, title: "Other Feed", iconUrl: "icon3.png" },
    subscription: { categoryId: null },
  },
];

describe("FilterDropdown Integration", () => {
  const setup = (searchParams: Record<string, string> = { saved: "true" }) => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    // Seed the cache
    queryClient.setQueryData(["categories"], mockCategories);
    queryClient.setQueryData(["subscriptions"], mockFeeds);

    const utils = render(
      <NuqsTestingAdapter searchParams={searchParams}>
        <QueryClientProvider client={queryClient}>
          <div id="feed-container">
            <FilterDropdown />
            <ActiveFilterChips />
          </div>
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    return { ...utils, user, queryClient };
  };

  it("filters out categories without feeds from the dropdown when in saved view", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /^filter$/i }));

    expect(screen.getByText(/^Tech$/)).toBeInTheDocument();
    expect(screen.queryByText("Empty Cat")).not.toBeInTheDocument();
  });

  it("implements macro selection: checking category checks all its feeds when in saved view", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /^filter$/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /^tech$/i }));

    // Should show category chip due to compaction
    expect(await screen.findByText(/Category: Tech/i)).toBeInTheDocument();

    // Re-open dropdown to check states
    await user.click(screen.getByRole("button", { name: /^filter$/i }));

    const techFeed1 = screen.getByRole("menuitemcheckbox", {
      name: /tech news 1/i,
    });
    const techFeed2 = screen.getByRole("menuitemcheckbox", {
      name: /tech news 2/i,
    });

    expect(techFeed1).toHaveAttribute("data-state", "checked");
    expect(techFeed2).toHaveAttribute("data-state", "checked");
  });

  it("implements micro selection: checking individual feeds when in saved view", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /^filter$/i }));
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: /tech news 1/i }),
    );

    // Should show feed chip (no compaction yet)
    expect(await screen.findByText(/Tech News 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Category: Tech/i)).not.toBeInTheDocument();
  });

  it("implements state compaction: checking all feeds manually collapses to a category chip when in saved view", async () => {
    const { user } = setup();

    // Open and check first feed
    await user.click(screen.getByRole("button", { name: /^filter$/i }));
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: /tech news 1/i }),
    );

    // Open and check second feed
    await user.click(screen.getByRole("button", { name: /^filter$/i }));
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: /tech news 2/i }),
    );

    // Should compact to one category chip
    expect(await screen.findByText(/Category: Tech/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Tech News 1$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Tech News 2$/i)).not.toBeInTheDocument();
  });

  it("implements de-compaction: unchecking one feed from a category chip state when in saved view", async () => {
    // Start with all selected (simulating compaction)
    const { user } = setup({
      saved: "true",
      feedIds: `${FEED_1_ID},${FEED_2_ID}`,
    });

    expect(screen.getByText(/Category: Tech/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^filter$/i }));
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: /tech news 2/i }),
    );

    // Category chip should disappear, replaced by the remaining feed
    expect(await screen.findByText(/Tech News 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Category: Tech/i)).not.toBeInTheDocument();
  });

  it("allows removing filters via chips", async () => {
    const { user } = setup({ saved: "true", status: "unread" });

    const unreadChip = screen.getByText(/unread only/i);
    expect(unreadChip).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", {
      name: /remove unread only filter/i,
    });
    await user.click(removeBtn);

    expect(unreadChip).not.toBeInTheDocument();
  });

  it("clears all filters when clicking Clear All", async () => {
    const { user } = setup({
      saved: "true",
      status: "unread",
      feedIds: `${FEED_1_ID}`,
    });

    expect(screen.getByText(/unread only/i)).toBeInTheDocument();
    expect(screen.getByText(/tech news 1/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(screen.queryByText(/unread only/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tech news 1/i)).not.toBeInTheDocument();
  });

  it("only shows read status option and hides category/feed options in general view", async () => {
    // General view (not saved)
    const { user } = setup({ saved: "false" });

    await user.click(screen.getByRole("button", { name: /^filter$/i }));

    // Status / radio items should be present
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: /^all items$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: /^unread only$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: /^read only$/i }),
    ).toBeInTheDocument();

    // Category and feed section labels should not be present
    expect(screen.queryByText(/categories/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/individual feeds/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Tech")).not.toBeInTheDocument();
    expect(screen.queryByText("Tech News 1")).not.toBeInTheDocument();
  });

  it("displays the filter button in active state when status is unread", () => {
    setup({ saved: "false", status: "unread" });

    expect(
      screen.getByRole("button", { name: /\(active\) filter/i }),
    ).toBeInTheDocument();
  });

  it("displays the filter button in active state when status is read", () => {
    setup({ saved: "false", status: "read" });

    expect(
      screen.getByRole("button", { name: /\(active\) filter$/i }),
    ).toBeInTheDocument();
  });

  it("displays the filter button in inactive state when status is all", () => {
    setup({ saved: "false", status: "all" });

    expect(
      screen.getByRole("button", { name: /^filter$/i }),
    ).toBeInTheDocument();
  });
});
