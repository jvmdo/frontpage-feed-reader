/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { FeedLayout } from "@/hooks/ui/use-view-options";
import { createMockItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { ItemCard } from "./item-card";

// Mock the hooks
vi.mock("@/hooks/item/use-active-item", () => ({
  useActiveItem: vi.fn(),
}));

vi.mock("@/hooks/item/use-toggle-bookmark", () => ({
  useToggleBookmark: vi.fn(),
}));

describe("ItemCard", () => {
  const mockSetActiveItem = vi.fn();
  const mockToggleBookmark = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActiveItem).mockReturnValue({
      setActiveItemId: mockSetActiveItem,
    } as any);
    vi.mocked(useToggleBookmark).mockReturnValue({
      mutate: mockToggleBookmark,
    } as any);
  });

  it("renders an unread indicator when isRead is false", () => {
    const data = createMockItemWithSource({ isRead: false });
    render(<ItemCard data={data} layout={FeedLayout.List} />);

    const article = screen.getByRole("article");
    const dot = article.querySelector(".bg-unread-indicator");
    expect(dot).toBeInTheDocument();
  });

  it("renders with read state styles when isRead is true", () => {
    const data = createMockItemWithSource({ isRead: true });
    render(<ItemCard data={data} layout={FeedLayout.List} />);

    const article = screen.getByRole("article");
    const dot = article.querySelector(".bg-unread-indicator");
    expect(dot).not.toBeInTheDocument();
  });

  it("calls setActiveItemId when clicking an item card", async () => {
    const user = userEvent.setup();
    const data = createMockItemWithSource();
    render(<ItemCard data={data} layout={FeedLayout.List} />);

    const button = screen.getByRole("button", {
      name: RegExp(data.item.title!, "i"),
    });
    await user.click(button);

    expect(mockSetActiveItem).toHaveBeenCalledWith(data.item.id);
  });

  it("renders category badge when categoryName is provided", () => {
    const data = createMockItemWithSource({ categoryName: "Technology" });
    render(<ItemCard data={data} layout={FeedLayout.List} />);

    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("does not render category badge when categoryName is missing", () => {
    const data = createMockItemWithSource({ categoryName: null });
    render(<ItemCard data={data} layout={FeedLayout.List} />);

    // The badge shouldn't be found
    const badges = screen.queryByText(/Technology/i);
    expect(badges).not.toBeInTheDocument();
  });

  it("skips all potentially focusable elements in excerpt during keyboard navigation", async () => {
    const user = userEvent.setup();
    const data = createMockItemWithSource({
      item: {
        title: "Test Item",
        description:
          'Excerpt with <a tabindex="-1" href="#">link</a> and <button tabindex="-1">btn</button>',
      },
    } as any);

    render(<ItemCard data={data} layout={FeedLayout.List} />);

    const openBtn = screen.getByRole("button", { name: /open reader/i });
    const saveBtn = screen.getByRole("button", { name: /save for later/i });

    openBtn.focus();
    expect(openBtn).toHaveFocus();

    // Tab should skip excerpt and land on save button
    await user.tab();
    expect(saveBtn).toHaveFocus();
  });

  it("isolates bookmark button clicks from the main card action", async () => {
    const user = userEvent.setup();
    const data = createMockItemWithSource();
    render(<ItemCard data={data} layout={FeedLayout.List} />);

    const saveBtn = screen.getByRole("button", { name: /save for later/i });
    await user.click(saveBtn);

    // Verify bookmark click triggered the bookmark hook
    expect(mockToggleBookmark).toHaveBeenCalledWith({ itemId: data.item.id });

    // Verify bookmark click DID NOT trigger the reader view
    expect(mockSetActiveItem).not.toHaveBeenCalled();
  });
});
