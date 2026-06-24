/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addFeedAction } from "@/actions/feed/add-feed-action";
import {
  type VerifiedFeedResult,
  verifyFeedAction,
} from "@/actions/feed/verify-feed-action";
import { useCategories } from "@/hooks/category/use-categories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { AddFeedDialog } from "./add-feed-dialog";

// Mock the server actions
vi.mock("@/actions/feed/add-feed-action", () => ({
  addFeedAction: vi.fn(),
}));

vi.mock("@/actions/feed/verify-feed-action", () => ({
  verifyFeedAction: vi.fn(),
}));

// Mock useCategories
vi.mock("@/hooks/category/use-categories", () => ({
  useCategories: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function makeVerifySuccessResult(
  overrides?: Partial<VerifiedFeedResult>,
): VerifiedFeedResult {
  return {
    success: true,
    alreadySubscribed: false,
    feed: {
      title: "Test Feed Title",
      description: "Test feed description",
      iconUrl: "https://example.com/icon.png",
    },
    ...overrides,
  };
}

describe("AddFeedDialog", () => {
  const mockCategories = [
    { id: 1, name: "Tech" },
    { id: 2, name: "Design" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
    } as any);

    // Mock PointerEvent methods for Radix UI Select
    if (typeof window !== "undefined") {
      window.HTMLElement.prototype.hasPointerCapture = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    }
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<AddFeedDialog>Open Dialog</AddFeedDialog>);
    return { user };
  };

  it("opens the dialog when the trigger is clicked", async () => {
    const { user } = setup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /add feed/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid URL", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /feed url/i });
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    await user.type(input, "http://www.dot.@");
    await user.click(verifyButton);

    expect(
      await screen.findByText(/please enter a valid url/i),
    ).toBeInTheDocument();
    expect(verifyFeedAction).not.toHaveBeenCalled();
  });

  it("guides user through verification, reveals category selection, and completes addition", async () => {
    const url = "https://example.com/feed.xml";

    // 1. Mock verification to succeed
    vi.mocked(verifyFeedAction).mockResolvedValueOnce(
      makeVerifySuccessResult(),
    );

    // 2. Mock subscription addition to succeed
    vi.mocked(addFeedAction).mockResolvedValueOnce({
      success: true,
      data: { id: "1", url } as any,
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /feed url/i });
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    // Category should be hidden initially
    expect(
      screen.queryByRole("combobox", { name: /category/i }),
    ).not.toBeInTheDocument();

    // Type URL and click Verify
    await user.type(input, url);
    await user.click(verifyButton);

    // Verify verification call
    expect(verifyFeedAction).toHaveBeenCalledExactlyOnceWith({ url });

    // Preview metadata should display
    expect(await screen.findByText(/Test Feed Title/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Feed Description/i)).toBeInTheDocument();

    // Open category select and select an option
    const selectTrigger = screen.getByRole("combobox", { name: /category/i });
    await user.click(selectTrigger);

    const option = screen.getByRole("option", { name: /tech/i });
    await user.click(option);

    // Verify button should transform to Add Feed button
    const submitButton = screen.getByRole("button", { name: /add/i });
    expect(submitButton).toBeInTheDocument();

    // Submit form
    await user.click(submitButton);

    expect(addFeedAction).toHaveBeenCalledExactlyOnceWith({
      url,
      categoryId: 1,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledOnce();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets verification state when URL is modified after verification", async () => {
    vi.mocked(verifyFeedAction).mockResolvedValueOnce(
      makeVerifySuccessResult(),
    );

    const url = "https://example.com/feed.xml";
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /feed url/i });
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    await user.type(input, url);
    await user.click(verifyButton);

    // Verified state visible
    expect(await screen.findByText(/Test Feed Title/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /category/i }),
    ).toBeInTheDocument();

    // Click Edit URL to go back to input step
    const editUrlButton = screen.getByRole("button", { name: /edit url/i });
    await user.click(editUrlButton);

    // Preview and Category should hide, and Verify button should be back
    expect(screen.queryByText(/Test Feed Title/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /category/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();

    // The input should be visible again and we type on it
    const urlInput = screen.getByRole("textbox", { name: /feed url/i });
    await user.type(urlInput, "a");
  });

  it("blocks submission and shows Already Subscribed badge if user is already subscribed", async () => {
    vi.mocked(verifyFeedAction).mockResolvedValueOnce(
      makeVerifySuccessResult({ alreadySubscribed: true }),
    );

    const url = "https://example.com/feed.xml";
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /feed url/i });
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    await user.type(input, url);
    await user.click(verifyButton);

    // Already Subscribed badge should display
    expect(await screen.findByText("Already Subscribed")).toBeInTheDocument();

    // Category input should remain hidden
    expect(
      screen.queryByRole("combobox", { name: /category/i }),
    ).not.toBeInTheDocument();

    // Add Feed button should be present but disabled
    const submitButton = screen.getByRole("button", { name: /add/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  describe("Error handling during verification", () => {
    const errorCases = [
      {
        name: "404 Not Found",
        error: "We couldn't reach this URL. Please double-check for typos.",
        code: "FEED_NOT_FOUND",
      },
      {
        name: "500 Internal Server Error",
        error:
          "The source site is currently slow or unavailable. Try again in a few minutes.",
        code: "FEED_UNAVAILABLE",
      },
      {
        name: "Network Error",
        error:
          "A network error occurred while reaching the feed. Please try again.",
        code: "FEED_NETWORK_ERROR",
      },
      {
        name: "Invalid Format",
        error:
          "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
        code: "FEED_INVALID_FORMAT",
      },
    ];

    for (const { name, error, code } of errorCases) {
      it(`shows friendly error message under input for ${name}`, async () => {
        vi.mocked(verifyFeedAction).mockResolvedValueOnce({
          success: false,
          error,
          code,
        });

        const { user } = setup();

        await user.click(screen.getByRole("button", { name: /open dialog/i }));

        const input = screen.getByRole("textbox", { name: /feed url/i });
        const verifyButton = screen.getByRole("button", { name: /verify/i });

        await user.type(input, "https://example.com/feed.xml");
        await user.click(verifyButton);

        // Validation message should display under the field
        expect(input).toHaveAccessibleDescription(error);

        // Feed preview and Category should not display
        expect(
          screen.queryByRole("combobox", { name: /category/i }),
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /verify/i }),
        ).toBeInTheDocument();
      });
    }
  });
});
