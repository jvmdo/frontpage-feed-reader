import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useActiveItem } from "@/hooks/use-active-item";
import { useMarkAsRead } from "@/hooks/use-mark-as-read";
import { createMockFeedItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { FeedItemCard } from "./feed-item-card";

// Mock the hooks
vi.mock("@/hooks/use-mark-as-read", () => ({
  useMarkAsRead: vi.fn(),
}));

vi.mock("@/hooks/use-active-item", () => ({
  useActiveItem: vi.fn(),
}));

describe("FeedItemCard", () => {
  const mockMarkAsRead = vi.fn();
  const mockSetActiveItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMarkAsRead).mockReturnValue({
      mutate: mockMarkAsRead,
    } as any);
    vi.mocked(useActiveItem).mockReturnValue({
      setActiveItemId: mockSetActiveItem,
    } as any);
  });

  it("renders an unread indicator when isRead is false", () => {
    const data = createMockFeedItemWithSource({ isRead: false });
    render(<FeedItemCard data={data} />);

    const article = screen.getByRole("article");
    expect(article).not.toHaveClass("opacity-60");

    const dot = article.querySelector(".bg-unread-indicator");
    expect(dot).toBeInTheDocument();
  });

  it("renders with read state styles when isRead is true", () => {
    const data = createMockFeedItemWithSource({ isRead: true });
    render(<FeedItemCard data={data} />);

    const article = screen.getByRole("article");
    expect(article).toHaveClass("opacity-60");

    const dot = article.querySelector(".bg-unread-indicator");
    expect(dot).not.toBeInTheDocument();
  });

  it("calls markAsRead and setActiveItemId when clicking an unread item card", async () => {
    const user = userEvent.setup();
    const data = createMockFeedItemWithSource({ isRead: false });
    render(<FeedItemCard data={data} />);

    const button = screen.getByRole("button", {
      name: RegExp(data.item.title!, "i"),
    });
    await user.click(button);

    expect(mockMarkAsRead).toHaveBeenCalledWith({ itemId: data.item.id });
    expect(mockSetActiveItem).toHaveBeenCalledWith(data.item.id);
  });

  it("calls only setActiveItemId when clicking an already read item card", async () => {
    const user = userEvent.setup();
    const data = createMockFeedItemWithSource({ isRead: true });
    render(<FeedItemCard data={data} />);

    const button = screen.getByRole("button", {
      name: RegExp(data.item.title!, "i"),
    });
    await user.click(button);

    expect(mockMarkAsRead).not.toHaveBeenCalled();
    expect(mockSetActiveItem).toHaveBeenCalledWith(data.item.id);
  });

  it("renders category badge when categoryName is provided", () => {
    const data = createMockFeedItemWithSource({ categoryName: "Technology" });
    render(<FeedItemCard data={data} />);

    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("does not render category badge when categoryName is missing", () => {
    const data = createMockFeedItemWithSource({ categoryName: null });
    render(<FeedItemCard data={data} />);

    // The badge shouldn't be found
    const badges = screen.queryByText(/Technology/i);
    expect(badges).not.toBeInTheDocument();
  });

  it("skips all potentially focusable elements in excerpt during keyboard navigation", async () => {
    const user = userEvent.setup();
    const data = createMockFeedItemWithSource({
      item: {
        title: "Test Article",
        description:
          'Excerpt with <a tabindex="-1" href="#">link</a> and <button tabindex="-1">btn</button>',
      },
    } as any);

    render(<FeedItemCard data={data} />);

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
    const data = createMockFeedItemWithSource();
    render(<FeedItemCard data={data} />);

    const saveBtn = screen.getByRole("button", { name: /save for later/i });
    await user.click(saveBtn);

    // Verify bookmark click didn't trigger the reader view
    expect(mockSetActiveItem).not.toHaveBeenCalled();
    expect(mockMarkAsRead).not.toHaveBeenCalled();
  });
});
