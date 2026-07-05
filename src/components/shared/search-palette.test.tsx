/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { usePathname, useRouter } from "next/navigation";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";
import { createMockListItemWithSource } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { SearchPalette } from "./search-palette";
import { SearchShortcutListener } from "./search-shortcut-listener";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

let mockDebouncedValue: string | null = null;

vi.mock("usehooks-ts", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useDebounceValue: (value: any) => [
      mockDebouncedValue !== null ? mockDebouncedValue : value,
      vi.fn(),
    ],
  };
});

// Mock components that are not the focus of this integration test
vi.mock("@/components/feed/feed-icon", () => ({
  FeedIcon: () => <div data-testid="feed-icon" />,
}));

vi.mock("@/components/shared/relative-date", () => ({
  RelativeDate: () => <div data-testid="relative-date" />,
}));

// Simple trigger component for testing
function PaletteTrigger() {
  const [_, setOpen] = useSearchPaletteState();
  return (
    <button type="button" onClick={() => setOpen(true)}>
      Open Search
    </button>
  );
}

function TestUrlDebugger() {
  const { activeItemId } = useActiveItem();
  const [open] = useSearchPaletteState();
  return (
    <div data-testid="url-debug">
      itemId: {activeItemId ?? "none"}, searchPalette: {open ? "true" : "false"}
    </div>
  );
}

describe("SearchPalette", () => {
  const mockPush = vi.fn();
  const mockResult = createMockListItemWithSource({
    item: { id: 1, title: "React Guide" },
    feed: { title: "Tech Blog" },
    searchSnippet: "This is a <b>React</b> guide.",
  });

  const mockSearchItems = (itemsOrResponse: any) => {
    server.use(
      http.get("/api/items", () => {
        if (itemsOrResponse instanceof HttpResponse) {
          return itemsOrResponse;
        }
        return HttpResponse.json(itemsOrResponse);
      }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    mockSearchItems([mockResult]);
  });

  const setup = (
    searchParams?: Record<string, string>,
    userOptions?: Parameters<typeof userEvent.setup>[0],
  ) => {
    const user = userEvent.setup(userOptions);
    render(
      <>
        <PaletteTrigger />
        <TestUrlDebugger />
        <SearchShortcutListener />
        <SearchPalette />
      </>,
      { searchParams },
    );
    return { user };
  };

  it("opens the search palette when the URL parameter is set", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", { name: /open search/i });

    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search your articles/i),
    ).toBeInTheDocument();
  });

  it("displays search results from the API", async () => {
    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "React");

    expect(await screen.findByText("React Guide")).toBeInTheDocument();
  });

  it("navigates while preserving the current segment and adding itemId", async () => {
    const { user } = setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await user.type(input, "React");

    const resultItem = await screen.findByText("React Guide");
    await user.click(resultItem);

    // Expect the URL states to update
    expect(screen.getByTestId("url-debug")).toHaveTextContent(
      "itemId: 1, searchPalette: true",
    );
  });

  it("loads more results and shows loading state during the fetch", async () => {
    const secondPageResult = createMockListItemWithSource({
      item: { id: 2, title: "Second Page Item" },
    });

    let resolveSecondPage!: (value: any) => void;
    const secondPagePromise = new Promise((resolve) => {
      resolveSecondPage = resolve;
    });

    server.use(
      http.get("/api/items", ({ request }) => {
        const url = new URL(request.url);
        const offset = url.searchParams.get("offset");

        if (offset === "10") {
          return secondPagePromise.then(() =>
            HttpResponse.json([secondPageResult]),
          );
        }

        // Return 10 items for the first page to trigger hasNextPage
        return HttpResponse.json(
          Array(10)
            .fill(null)
            .map((_, i) => ({
              ...mockResult,
              item: { ...mockResult.item, id: i + 3 },
            })),
        );
      }),
    );

    const { user } = setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await user.type(input, "React");

    // 1. Find and click "Load more"
    const loadMoreButton = await screen.findByText(/load more results/i);
    await user.click(loadMoreButton);

    // 2. Assert "Searching more..." is visible while the promise is hanging
    expect(screen.getByText(/searching more/i)).toBeInTheDocument();

    // 3. Resolve the second page
    resolveSecondPage?.([secondPageResult]);

    // 4. Assert second page content is displayed
    expect(await screen.findByText("Second Page Item")).toBeInTheDocument();
    expect(screen.queryByText(/searching more/i)).not.toBeInTheDocument();
  });

  it("shows loading state and then content using the hanging promise pattern", async () => {
    let resolveSearch!: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    server.use(
      http.get("/api/items", async () => {
        await promise;
        return HttpResponse.json([mockResult]);
      }),
    );

    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "React");

    // 1. Assert loading indicator is visible
    expect(screen.getByText(/searching/i)).toBeInTheDocument();

    // 2. Resolve the promise
    resolveSearch?.([mockResult]);

    // 3. Assert content is displayed
    expect(await screen.findByText("React Guide")).toBeInTheDocument();
    expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
  });

  it("shows empty state when no results are found", async () => {
    mockSearchItems([]);

    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "xyz789");

    expect(
      await screen.findByText(/no results found for "xyz789"/i),
    ).toBeInTheDocument();
  });

  it("shows error state when the API fails", async () => {
    mockSearchItems(new HttpResponse(null, { status: 500 }));

    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "React");

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
  });

  it("allows spaces to be typed but trims them before querying", async () => {
    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "  React    ");

    expect(await screen.findByText("React Guide")).toBeInTheDocument();
  });

  it("displays the trimmed search query in the empty state", async () => {
    mockSearchItems([]);

    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "  xyz789  ");

    expect(
      await screen.findByText(/no results found for "xyz789"/i),
    ).toBeInTheDocument();
  });

  it("does not trigger search when only spaces are typed", async () => {
    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    await userEvent.type(input, "   ");

    expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
    expect(screen.queryByText("React Guide")).not.toBeInTheDocument();
  });

  it("does not trigger search with fewer than 2 non-whitespace characters", async () => {
    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);

    // Type 1 char
    await userEvent.type(input, "a");
    expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
    expect(screen.queryByText("React Guide")).not.toBeInTheDocument();

    // Type a space
    await userEvent.type(input, " ");
    expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
    expect(screen.queryByText("React Guide")).not.toBeInTheDocument();

    // Type second char
    await userEvent.type(input, "b");
    expect(await screen.findByText("React Guide")).toBeInTheDocument();
    expect(
      screen.queryByText(/start typing to search/i),
    ).not.toBeInTheDocument();
  });

  it("makes display transitions react to live input immediately, not debounced value", async () => {
    mockDebouncedValue = "xyz789";
    mockSearchItems([]);

    setup({ searchPalette: "true" });

    const input = screen.getByPlaceholderText(/search your articles/i);
    // Type query (both raw and debounced are "xyz789")
    await userEvent.type(input, "xyz789");

    // Empty state should be visible
    expect(
      await screen.findByText(/no results found for "xyz789"/i),
    ).toBeInTheDocument();

    // Simulate clearing the input, but debounced value remains "xyz789" (lagging)
    await userEvent.clear(input);

    // Display must update immediately: no empty state, show hint
    expect(
      screen.queryByText(/no results found for "xyz789"/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();

    mockDebouncedValue = null;
  });
});
