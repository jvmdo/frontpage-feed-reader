/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { createMockItemWithSource } from "@/tests/factories";
import { ItemReaderLightbox } from "./item-reader-lightbox";
import { ReaderView } from "./reader-view";

// Mock hooks and store
vi.mock("@/hooks/item/use-active-item");
vi.mock("@/hooks/item/use-item");
vi.mock("@/hooks/item/use-item-reader-navigation");
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

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId: mockSetActiveItemId,
    });

    vi.mocked(useItemReaderNavigation).mockReturnValue({
      goToNext: vi.fn(),
      goToPrev: vi.fn(),
      hasNext: true,
      hasPrev: true,
    } as any);
  });

  it("renders correctly when open and loading", () => {
    vi.mocked(useItem).mockReturnValue({ isPending: true } as any);

    render(<ItemReaderLightbox />);

    expect(screen.getByRole("status")).toHaveTextContent(/Loading/i);
  });

  it("renders error state", () => {
    vi.mocked(useItem).mockReturnValue({
      error: new Error("Failed to load"),
      isPending: false,
      isError: true,
    } as any);

    render(<ItemReaderLightbox />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("renders the item content when loaded", () => {
    const data = createMockItemWithSource({
      item: { title: "Loaded Article" },
    });

    vi.mocked(useItem).mockReturnValue({ data, isLoading: false } as any);

    render(<ItemReaderLightbox />);

    expect(
      screen.getByRole("heading", { name: "Loaded Article" }),
    ).toBeInTheDocument();
  });

  it("closes the lightbox when clicking the close button", async () => {
    const data = createMockItemWithSource({ item: { id: 1 } });

    vi.mocked(useItem).mockReturnValue({ data, isLoading: false } as any);

    render(<ItemReaderLightbox />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(mockSetActiveItemId).toHaveBeenCalledWith(null);
  });
});
