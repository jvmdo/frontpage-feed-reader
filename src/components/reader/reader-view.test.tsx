/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { getItemReaderScroll, saveItemReaderScroll } from "@/lib/scroll-store";
import { createMockItemWithSource } from "@/tests/factories";
import { ItemReaderLightbox } from "./item-reader-lightbox";
import { ReaderView } from "./reader-view";

// Mock hooks and store
vi.mock("@/hooks/item/use-active-item");
vi.mock("@/hooks/item/use-item");
vi.mock("@/hooks/item/use-item-reader-navigation");
vi.mock("@/lib/scroll-store");
vi.mock("@/hooks/ui/use-reader-shortcuts");

describe("ReaderView", () => {
  it("renders basic metadata and title", () => {
    const data = createMockItemWithSource({
      item: { title: "Test Item Title" },
      feed: { title: "Test Feed Name" },
    });

    render(<ReaderView data={data} />);

    expect(
      screen.getByRole("heading", { name: "Test Item Title" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /View original/i }),
    ).toBeInTheDocument();
  });

  it("renders content from description when content is missing", () => {
    const data = createMockItemWithSource({
      item: { content: null, description: "<p>Description content</p>" },
    });

    render(<ReaderView data={data} />);

    expect(screen.getByText("Description content")).toBeInTheDocument();
  });

  it("renders empty state when no content is available", () => {
    const data = createMockItemWithSource({
      item: { content: null, description: null },
    });

    render(<ReaderView data={data} />);

    expect(screen.getByText(/No content available/i)).toBeInTheDocument();
  });

  it("displays excerpt warning and large button when isExcerpt is true", () => {
    const data = createMockItemWithSource({
      isExcerpt: true,
      item: { url: "https://example.com/full" },
    });

    render(<ReaderView data={data} />);

    expect(screen.getByText(/provided only an excerpt/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View original/i }),
    ).toHaveAttribute("href", "https://example.com/full");
  });
});

describe("ItemReaderLightbox Integration", () => {
  const mockSetActiveItemId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useActiveItem as any).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: mockSetActiveItemId,
    });
    (useItemReaderNavigation as any).mockReturnValue({
      goToNext: vi.fn(),
      goToPrev: vi.fn(),
      hasNext: true,
      hasPrev: true,
    });
    (getItemReaderScroll as any).mockReturnValue(0);
  });

  it("renders correctly when open and loading", () => {
    (useItem as any).mockReturnValue({ isLoading: true });

    render(<ItemReaderLightbox />);

    expect(screen.getByRole("status")).toHaveTextContent(/Loading/i);
  });

  it("renders error state", () => {
    (useItem as any).mockReturnValue({
      error: new Error("Failed to load"),
      isLoading: false,
    });

    render(<ItemReaderLightbox />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("renders the item content when loaded", () => {
    const data = createMockItemWithSource({
      item: { title: "Loaded Article" },
    });
    (useItem as any).mockReturnValue({ data, isLoading: false });

    render(<ItemReaderLightbox />);

    expect(
      screen.getByRole("heading", { name: "Loaded Article" }),
    ).toBeInTheDocument();
  });

  it("closes the lightbox and saves scroll when clicking the close button", async () => {
    const data = createMockItemWithSource({ item: { id: 1 } });
    (useItem as any).mockReturnValue({ data, isLoading: false });

    render(<ItemReaderLightbox />);

    // Query by the X icon class
    const xIcon = document.querySelector(".lucide-x");
    const btn = xIcon?.closest("button");
    if (btn) {
      await userEvent.click(btn);
    }

    expect(mockSetActiveItemId).toHaveBeenCalledWith(null);
    expect(saveItemReaderScroll).toHaveBeenCalledWith(1, 0);
  });

  it("persists scroll position when navigating between articles", async () => {
    // This test verifies the useEffect logic for scroll persistence
    const item1 = createMockItemWithSource({ item: { id: 1 } });
    const item2 = createMockItemWithSource({ item: { id: 2 } });

    const { rerender } = render(<ItemReaderLightbox />);

    // 1. Initial render with Item 1
    (useItem as any).mockReturnValue({ data: item1, isLoading: false });
    (useActiveItem as any).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: mockSetActiveItemId,
    });

    rerender(<ItemReaderLightbox />);

    // Mock scroll position
    const container = document
      .querySelector(".lucide-x")
      ?.closest("header")?.nextElementSibling;
    if (container) {
      Object.defineProperty(container, "scrollTop", {
        value: 100,
        writable: true,
      });
    }

    // 2. Switch to Item 2
    (useItem as any).mockReturnValue({ data: item2, isLoading: false });
    (useActiveItem as any).mockReturnValue({
      activeItemId: 2,
      setActiveItemId: mockSetActiveItemId,
    });

    rerender(<ItemReaderLightbox />);

    // Verify Item 1 scroll was saved
    expect(saveItemReaderScroll).toHaveBeenCalledWith(1, 100);

    // Verify Item 2 starts at 0 (or whatever is in store)
    // In this test environment, it might not actually update the DOM property
    // so we check if the getItemReaderScroll was called
    expect(getItemReaderScroll).toHaveBeenCalledWith(2);

    // 3. Switch back to Item 1
    (getItemReaderScroll as any).mockReturnValue(100);
    (useItem as any).mockReturnValue({ data: item1, isLoading: false });
    (useActiveItem as any).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: mockSetActiveItemId,
    });

    rerender(<ItemReaderLightbox />);

    expect(getItemReaderScroll).toHaveBeenCalledWith(1);
  });
});
