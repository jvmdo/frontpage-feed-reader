/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { useSetReadStatus } from "@/hooks/item/use-set-read-status";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { createMockItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { ItemReaderLightbox } from "./item-reader-lightbox";

// Mock hooks and store
vi.mock("@/hooks/item/use-active-item");
vi.mock("@/hooks/item/use-item");
vi.mock("@/hooks/item/use-item-reader-navigation");
vi.mock("@/hooks/ui/use-reader-shortcuts");
vi.mock("@/hooks/item/use-toggle-bookmark");
vi.mock("@/hooks/item/use-set-read-status");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("ItemReaderLightbox Integration", () => {
  const mockSetActiveItemId = vi.fn();
  const mockSetReadStatus = vi.fn();

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

    vi.mocked(useToggleBookmark).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useSetReadStatus).mockReturnValue({
      mutate: mockSetReadStatus,
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

  it("marks an unread item as read when loaded", () => {
    const data = createMockItemWithSource({ item: { id: 1 }, isRead: false });

    vi.mocked(useItem).mockReturnValue({ data, isLoading: false } as any);

    render(<ItemReaderLightbox />);

    expect(mockSetReadStatus).toHaveBeenCalledWith({ itemId: 1, isRead: true });
  });

  it("does not mark an already read item as read when loaded", () => {
    const data = createMockItemWithSource({ item: { id: 1 }, isRead: true });

    vi.mocked(useItem).mockReturnValue({ data, isLoading: false } as any);

    render(<ItemReaderLightbox />);

    expect(mockSetReadStatus).not.toHaveBeenCalled();
  });

  it("toggles read status when clicking the toggle button", async () => {
    const data = createMockItemWithSource({
      item: { id: 1 },
      isRead: true,
      isWatermarked: false,
    });

    vi.mocked(useItem).mockReturnValue({ data, isLoading: false } as any);

    render(<ItemReaderLightbox />);

    // Click the toggle button to mark as unread (there are desktop & mobile instances, so select all and click first)
    const toggleButtons = screen.getAllByRole("button", {
      name: /mark as unread/i,
    });
    await userEvent.click(toggleButtons[0]);

    expect(mockSetReadStatus).toHaveBeenLastCalledWith({
      itemId: 1,
      isRead: false,
    });
  });

  it("shows info toast and does not call setReadStatus when toggling a watermarked item", async () => {
    const data = createMockItemWithSource({
      item: { id: 1 },
      isRead: true,
      isWatermarked: true,
    });

    vi.mocked(useItem).mockReturnValue({ data, isLoading: false } as any);

    render(<ItemReaderLightbox />);

    const toggleButtons = screen.getAllByRole("button", {
      name: /mark as unread/i,
    });
    await userEvent.click(toggleButtons[0]);

    expect(mockSetReadStatus).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining("archived by 'Mark all read'"),
    );
  });
});
