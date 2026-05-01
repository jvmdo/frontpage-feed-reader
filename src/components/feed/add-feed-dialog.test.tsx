/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addFeedAction } from "@/actions/feed/add-feed-action";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@/tests/rtl-utils";
import { AddFeedDialog } from "./add-feed-dialog";

// Mock the server action
vi.mock("@/actions/feed/add-feed-action", () => ({
  addFeedAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AddFeedDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const submitButton = screen.getByRole("button", { name: /add/i });

    await user.type(input, "http://www.dot.@");
    await user.click(submitButton);

    expect(
      await screen.findByText(/please enter a valid url/i),
    ).toBeInTheDocument();
    expect(addFeedAction).not.toHaveBeenCalled();
  });

  it("calls addFeedAction and shows success toast on valid submission", async () => {
    const url = "https://example.com/feed.xml";

    vi.mocked(addFeedAction).mockResolvedValue({
      success: true,
      data: { id: "1", url } as any,
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /feed url/i });
    const submitButton = screen.getByRole("button", { name: /add/i });

    await user.type(input, url);
    await user.click(submitButton);

    // The action call is usually synchronous upon submission, so no wait is needed.
    expect(addFeedAction).toHaveBeenCalledExactlyOnceWith({ url });

    // The toast happens strictly AFTER the promise resolves in TanStack Query's `onSuccess`.
    // You MUST use waitFor here to prevent flakiness.
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledExactlyOnceWith(
        "Feed added successfully",
      );
    });

    // Since the async cycle is complete, the DOM is fully updated.
    // A synchronous assertion is perfect here.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays a loading state while the action is pending", async () => {
    const url = "https://example.com/feed.xml";

    // The Deferred Promise pattern
    // Create a promise that ONLY resolves when we call `resolveAction`
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(addFeedAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /feed url/i });
    const submitButton = screen.getByRole("button", { name: /add/i });

    await user.type(input, url);
    await user.click(submitButton);

    // Because the promise is frozen, the UI is guaranteed to be stuck in its loading state.
    // You don't need waitFor here because the state update from the click is synchronous.
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/adding/i);

    // Unfreeze the promise! Simulate the server finally returning data.
    resolveAction({ success: true, data: { id: "1", url } });

    await waitForElementToBeRemoved(screen.queryByRole("dialog"));
  });

  describe("Error handling", () => {
    const errorCases = [
      {
        name: "404 Not Found",
        error: "We couldn't reach this URL.",
        code: "FEED_NOT_FOUND",
      },
      {
        name: "500 Internal Server Error",
        error: "The source site is currently slow or unavailable.",
        code: "FEED_UNAVAILABLE",
      },
      {
        name: "Network Error",
        error: "A network error occurred while reaching the feed.",
        code: "FEED_NETWORK_ERROR",
      },
      {
        name: "Invalid Format",
        error: "This link doesn't seem to be a valid RSS or Atom feed.",
        code: "FEED_INVALID_FORMAT",
      },
    ];

    for (const { name, error, code } of errorCases) {
      it(`shows friendly error toast for ${name}`, async () => {
        vi.mocked(addFeedAction).mockResolvedValue({
          success: false,
          error,
          code,
        });

        const { user } = setup();

        await user.click(screen.getByRole("button", { name: /open dialog/i }));

        const input = screen.getByRole("textbox", { name: /feed url/i });
        const submitButton = screen.getByRole("button", { name: /add/i });

        await user.type(input, "https://example.com/feed.xml");
        await user.click(submitButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledExactlyOnceWith(error);
        });

        // Dialog should stay open
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    }
  });
});
