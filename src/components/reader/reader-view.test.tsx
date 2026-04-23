/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useActiveItem } from "@/hooks/use-active-item";
import { useFeedItem } from "@/hooks/use-feed-item";
import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { createMockFeedItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { FeedReaderSheet } from "./feed-reader-sheet";
import { ReaderView } from "./reader-view";

vi.mock("@/hooks/use-active-item");
vi.mock("@/hooks/use-feed-item");
vi.mock("@/hooks/use-feed-navigation");
vi.mock("@/hooks/use-reader-shortcuts");

afterEach(() => {
  vi.clearAllMocks();
});

describe("ReaderView", () => {
  it("renders basic metadata and title", () => {
    const data = createMockFeedItemWithSource({
      item: { title: "Test Article Title" },
      feed: { title: "Test Feed Name" },
    });
    render(<ReaderView data={data} />);

    expect(
      screen.getByRole("heading", { name: "Test Article Title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Feed Name")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View original/i }),
    ).toBeInTheDocument();
  });

  it("renders HTML content", () => {
    const data = createMockFeedItemWithSource({
      item: {
        content: `
          <p>Paragraph 1</p>
          <blockquote>Blockquote content</blockquote>
          <a href="https://example.com">Link</a>
        `,
      },
    });
    render(<ReaderView data={data} />);

    expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
    expect(screen.getByText("Blockquote content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Link/i })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});

describe("FeedReaderSheet Integration", () => {
  beforeEach(() => {
    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: vi.fn(),
    });

    vi.mocked(useFeedNavigation).mockReturnValue({
      goToNext: vi.fn(),
      goToPrev: vi.fn(),
      hasNext: false,
      hasPrev: false,
    } as any);
  });

  it("displays loading skeleton when loading", () => {
    vi.mocked(useFeedItem).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<FeedReaderSheet />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /loading article content/i,
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("renders content and navigation when data is loaded", () => {
    const mockData = createMockFeedItemWithSource({
      item: { title: "Loaded Article" },
    });

    vi.mocked(useFeedItem).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useFeedNavigation).mockReturnValue({
      hasNext: true,
      hasPrev: true,
    } as any);

    render(<FeedReaderSheet />);

    expect(
      screen.getByRole("heading", { name: "Loaded Article" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /previous article/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next article/i }),
    ).toBeInTheDocument();
  });

  it("triggers navigation functions on button click", async () => {
    const user = userEvent.setup();
    const goToNext = vi.fn();
    const mockData = createMockFeedItemWithSource();

    vi.mocked(useFeedItem).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useFeedNavigation).mockReturnValue({
      goToNext,
      goToPrev: vi.fn(),
      hasNext: true,
    } as any);

    render(<FeedReaderSheet />);

    await user.click(screen.getByRole("button", { name: /next article/i }));
    expect(goToNext).toHaveBeenCalled();
  });

  it("disables buttons when no neighbors exist", () => {
    const mockData = createMockFeedItemWithSource();

    vi.mocked(useFeedItem).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    render(<FeedReaderSheet />);

    expect(
      screen.getByRole("button", { name: /previous article/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /next article/i }),
    ).toBeDisabled();
  });

  it("persists scroll position when navigating between articles", () => {
    const mockData1 = createMockFeedItemWithSource({ item: { id: 1, title: "Art 1" } });
    const mockData2 = createMockFeedItemWithSource({ item: { id: 2, title: "Art 2" } });

    vi.mocked(useActiveItem).mockReturnValue({ activeItemId: 1, setActiveItemId: vi.fn() });
    vi.mocked(useFeedItem).mockReturnValue({ data: mockData1, isLoading: false, error: null } as any);

    const { rerender } = render(<FeedReaderSheet />);
    
    const container = screen.getByRole("region", { name: /article content/i });
    
    // Simulate scrolling Article 1
    Object.defineProperty(container, "scrollTop", { value: 100, writable: true });
    
    // Switch to Article 2
    vi.mocked(useActiveItem).mockReturnValue({ activeItemId: 2, setActiveItemId: vi.fn() });
    vi.mocked(useFeedItem).mockReturnValue({ data: mockData2, isLoading: false, error: null } as any);
    
    rerender(<FeedReaderSheet />);

    // Verify Article 2 starts at 0 (or whatever is in store)
    expect(container.scrollTop).toBe(0);

    // Switch back to Article 1
    vi.mocked(useActiveItem).mockReturnValue({ activeItemId: 1, setActiveItemId: vi.fn() });
    vi.mocked(useFeedItem).mockReturnValue({ data: mockData1, isLoading: false, error: null } as any);
    
    rerender(<FeedReaderSheet />);
    
    // Verify Article 1 restored its 100px
    expect(container.scrollTop).toBe(100);
  });
});
