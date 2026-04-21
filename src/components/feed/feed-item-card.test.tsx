import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useMarkAsRead } from "@/hooks/use-mark-as-read";
import { createMockFeedItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { FeedItemCard } from "./feed-item-card";

// Mock the hook
vi.mock("@/hooks/use-mark-as-read", () => ({
  useMarkAsRead: vi.fn(),
}));

describe("FeedItemCard", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMarkAsRead).mockReturnValue({
      mutate: mockMutate,
    } as any);
  });

  it("renders an unread indicator when isRead is false", () => {
    const data = createMockFeedItemWithSource({ isRead: false });
    render(<FeedItemCard data={data} />);

    // Check for the indicator (aria-hidden="true" but visible to screen readers via container or just checking class/presence)
    // Our implementation uses a div with bg-unread-indicator
    const article = screen.getByRole("article");
    expect(article).toHaveClass("border-l-unread-indicator");

    // The dot div has bg-unread-indicator
    const dot = article.querySelector(".bg-unread-indicator");
    expect(dot).toBeInTheDocument();
  });

  it("does not render unread indicator when isRead is true", () => {
    const data = createMockFeedItemWithSource({ isRead: true });
    render(<FeedItemCard data={data} />);

    const article = screen.getByRole("article");
    expect(article).not.toHaveClass("border-l-unread-indicator");
    expect(article).toHaveClass("opacity-70");

    const dot = article.querySelector(".bg-unread-indicator");
    expect(dot).not.toBeInTheDocument();
  });

  it("calls markAsRead when clicking the link of an unread item", async () => {
    const user = userEvent.setup();
    const data = createMockFeedItemWithSource({ isRead: false });
    render(<FeedItemCard data={data} />);

    const link = screen.getByRole("link", {
      name: RegExp(data.item.title!, "i"),
    });
    await user.click(link);

    expect(mockMutate).toHaveBeenCalledWith({ itemId: data.item.id });
  });

  it("does not call markAsRead when clicking the link of an already read item", async () => {
    const user = userEvent.setup();
    const data = createMockFeedItemWithSource({ isRead: true });
    render(<FeedItemCard data={data} />);

    const link = screen.getByRole("link", {
      name: RegExp(data.item.title!, "i"),
    });
    await user.click(link);

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
