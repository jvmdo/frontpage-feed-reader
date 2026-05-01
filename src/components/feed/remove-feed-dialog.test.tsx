/** biome-ignore-all lint/suspicious/noExplicitAny: test assets */

import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeFeedAction } from "@/actions/feed/remove-feed-action";
import { createMockFeed, createMockSubscription } from "@/tests/factories";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@/tests/rtl-utils";
import { RemoveFeedDialog } from "./remove-feed-dialog";

// Mock the server action
vi.mock("@/actions/feed/remove-feed-action", () => ({
  removeFeedAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RemoveFeedDialog", () => {
  const mockFeed = createMockFeed({
    title: "Target Feed",
    url: "https://example.com/rss",
  });
  const mockSubscription = createMockSubscription({
    id: 123,
    feedId: mockFeed.id,
    customTitle: "My Custom Feed Name",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TestWrapper(props: any) {
    const [open, setOpen] = useState(true);
    return (
      <RemoveFeedDialog
        subscription={mockSubscription}
        feed={mockFeed}
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    );
  }

  const setup = (props = {}) => {
    const user = userEvent.setup();
    render(<TestWrapper {...props} />);
    return { user };
  };

  it("renders with feed information", async () => {
    setup();

    expect(await screen.findByText(/remove feed/i)).toBeInTheDocument();
    expect(await screen.findByText("My Custom Feed Name")).toBeInTheDocument();
    expect(
      await screen.findByText("https://example.com/rss"),
    ).toBeInTheDocument();
  });

  it("calls removeFeedAction and shows success toast on confirmation", async () => {
    vi.mocked(removeFeedAction).mockResolvedValue({
      success: true,
      data: { id: mockSubscription.id } as any,
    });

    const { user } = setup();

    const removeButton = await screen.findByRole("button", {
      name: /^remove$/i,
    });
    await user.click(removeButton);

    expect(removeFeedAction).toHaveBeenCalledWith({ id: mockSubscription.id });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Feed removed");
    });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("shows error toast when removal fails", async () => {
    vi.mocked(removeFeedAction).mockResolvedValue({
      success: false,
      error: "Deletion Failed",
      code: "DELETION_FAILED",
    });

    const { user } = setup();

    const removeButton = await screen.findByRole("button", {
      name: /^remove$/i,
    });
    await user.click(removeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Deletion Failed");
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("displays loading state while removing", async () => {
    let resolveAction!: (reason: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(removeFeedAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    const removeButton = await screen.findByRole("button", {
      name: /remove/i,
    });
    await user.click(removeButton);

    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveTextContent(/removing/i);

    resolveAction({ success: true, data: mockFeed });

    await waitForElementToBeRemoved(screen.queryByRole("alertdialog"));
  });

  it("closes dialog when cancel is clicked", async () => {
    const { user } = setup();

    const cancelButton = await screen.findByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });
});
