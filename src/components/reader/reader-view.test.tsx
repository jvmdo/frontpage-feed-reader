/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { createMockItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { ReaderView } from "./reader-view";

vi.mock("@/hooks/item/use-toggle-bookmark");

describe("ReaderView", () => {
  beforeEach(() => {
    vi.mocked(useToggleBookmark).mockReturnValue({
      mutate: vi.fn(),
    } as any);
  });

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
