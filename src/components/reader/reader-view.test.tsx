/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { createMockItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { ItemReaderLightbox } from "./item-reader-lightbox";
import { ReaderView } from "./reader-view";

vi.mock("@/hooks/item/use-active-item");
vi.mock("@/hooks/item/use-item");
vi.mock("@/hooks/item/use-item-reader-navigation");
vi.mock("@/hooks/ui/use-reader-shortcuts");

afterEach(() => {
  vi.clearAllMocks();
});

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
    expect(screen.getByText("Test Feed Name")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View original/i }),
    ).toBeInTheDocument();
  });

  it("renders HTML content", () => {
    const data = createMockItemWithSource({
      item: {
        content: `
          <p>Paragraph 1</p>
          <blockquote>Blockquote content</blockquote>
          <a href="https://example.com">Link</a>
        `,
      },
      isExcerpt: false,
    });
    render(<ReaderView data={data} />);

    expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
    expect(screen.getByText("Blockquote content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Link/i })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("identifies and renders excerpt UI", () => {
    const data = createMockItemWithSource({
      item: {
        content: "<p>Excerpt content</p>",
        url: "https://example.com/full",
      },
      feed: { title: "Test Feed" },
      isExcerpt: true,
    });
    render(<ReaderView data={data} />);

    expect(
      screen.getByText(/The author provided only an excerpt/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View original/i })).toHaveAttribute(
      "href",
      "https://example.com/full",
    );
  });

  it("does not show excerpt UI for full articles", () => {
    const data = createMockItemWithSource({
      item: {
        content: "<p>Full content</p>",
      },
      isExcerpt: false,
    });
    render(<ReaderView data={data} />);

    expect(
      screen.queryByText(/The author provided only an excerpt/i),
    ).not.toBeInTheDocument();
  });
});

describe("ItemReaderLightbox Integration", () => {
  beforeEach(() => {
    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: vi.fn(),
    });

    vi.mocked(useItemReaderNavigation).mockReturnValue({
      goToNext: vi.fn(),
      goToPrev: vi.fn(),
      hasNext: false,
      hasPrev: false,
    } as any);
  });

  it("displays loading skeleton when loading", () => {
    vi.mocked(useItem).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<ItemReaderLightbox />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /loading item content/i,
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("renders content and navigation when data is loaded", () => {
    const mockData = createMockItemWithSource({
      item: { title: "Loaded Item" },
    });

    vi.mocked(useItem).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useItemReaderNavigation).mockReturnValue({
      hasNext: true,
      hasPrev: true,
    } as any);

    render(<ItemReaderLightbox />);

    expect(
      screen.getByRole("heading", { name: "Loaded Item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /previous item/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next item/i }),
    ).toBeInTheDocument();
  });

  it("triggers navigation functions on button click", async () => {
    const user = userEvent.setup();
    const goToNext = vi.fn();
    const mockData = createMockItemWithSource();

    vi.mocked(useItem).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useItemReaderNavigation).mockReturnValue({
      goToNext,
      goToPrev: vi.fn(),
      hasNext: true,
    } as any);

    render(<ItemReaderLightbox />);

    await user.click(screen.getByRole("button", { name: /next item/i }));
    expect(goToNext).toHaveBeenCalled();
  });

  it("disables buttons when no neighbors exist", () => {
    const mockData = createMockItemWithSource();

    vi.mocked(useItem).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    render(<ItemReaderLightbox />);

    expect(
      screen.getByRole("button", { name: /previous item/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /next item/i })).toBeDisabled();
  });

  it("persists scroll position when navigating between articles", () => {
    const mockData1 = createMockItemWithSource({
      item: { id: 1, title: "Art 1" },
    });
    const mockData2 = createMockItemWithSource({
      item: { id: 2, title: "Art 2" },
    });

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: vi.fn(),
    });
    vi.mocked(useItem).mockReturnValue({
      data: mockData1,
      isLoading: false,
      error: null,
    } as any);

    const { rerender } = render(<ItemReaderLightbox />);

    const container = screen.getByRole("region", { name: /item content/i });

    // Simulate scrolling Item 1
    Object.defineProperty(container, "scrollTop", {
      value: 100,
      writable: true,
    });

    // Switch to Item 2
    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 2,
      setActiveItemId: vi.fn(),
    });
    vi.mocked(useItem).mockReturnValue({
      data: mockData2,
      isLoading: false,
      error: null,
    } as any);

    rerender(<ItemReaderLightbox />);

    // Verify Item 2 starts at 0 (or whatever is in store)
    expect(container.scrollTop).toBe(0);

    // Switch back to Item 1
    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: vi.fn(),
    });
    vi.mocked(useItem).mockReturnValue({
      data: mockData1,
      isLoading: false,
      error: null,
    } as any);

    rerender(<ItemReaderLightbox />);

    // Verify Item 1 restored its 100px
    expect(container.scrollTop).toBe(100);
  });
});
