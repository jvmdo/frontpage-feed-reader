/** biome-ignore-all lint/suspicious/noExplicitAny: test assets */

import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useState } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateFeedAction } from "@/actions/feed/update-feed-action";
import {
  createMockCategory,
  createMockFeed,
  createMockSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@/tests/rtl-utils";
import { EditFeedDialog } from "./edit-feed-dialog";

// Mock the server action
vi.mock("@/actions/feed/update-feed-action", () => ({
  updateFeedAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("EditFeedDialog", () => {
  const mockFeed = createMockFeed({ title: "Original Feed" });
  const mockSubscription = createMockSubscription({
    feedId: mockFeed.id,
    customTitle: "My Custom Title",
    categoryId: 1,
  });

  const mockCategories = [
    createMockCategory({ id: 1, name: "Tech" }),
    createMockCategory({ id: 2, name: "News" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PointerEvent methods for Radix UI Select
    if (typeof window !== "undefined") {
      window.HTMLElement.prototype.hasPointerCapture = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    }

    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: mockCategories,
        });
      }),
    );
  });

  function TestWrapper(props: any) {
    const [open, setOpen] = useState(true);
    return (
      <EditFeedDialog
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

  it("renders with initial values from subscription", async () => {
    setup();

    expect(await screen.findByLabelText(/title/i)).toHaveValue(
      "My Custom Title",
    );

    // Select is a bit trickier to check value directly, but we can verify the trigger text.
    // We use a more specific selector to avoid matching the hidden native <option>
    const selectValue = await screen.findByText("Tech", {
      selector: "[data-slot='select-value']",
    });

    expect(selectValue).toBeInTheDocument();
  });

  it("shows validation error when title is cleared", async () => {
    const { user } = setup();

    const titleInput = await screen.findByLabelText(/title/i);
    await user.clear(titleInput);

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveButton);

    expect(
      await screen.findByText(/title cannot be empty/i),
    ).toBeInTheDocument();
    expect(updateFeedAction).not.toHaveBeenCalled();
  });

  it("calls updateFeedAction and shows success toast", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: true,
      data: { ...mockSubscription, customTitle: "Updated Title" } as any,
    });

    const { user } = setup();

    const titleInput = await screen.findByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveButton);

    expect(updateFeedAction).toHaveBeenCalledWith({
      id: mockSubscription.id,
      customTitle: "Updated Title",
      categoryId: 1,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Subscription updated");
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("allows changing the category", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: true,
      data: { ...mockSubscription, categoryId: 2 } as any,
    });

    const { user } = setup();

    const selectTrigger = await screen.findByRole("combobox", {
      name: /category/i,
    });
    await user.click(selectTrigger);

    const newsOption = await screen.findByRole("option", { name: "News" });
    await user.click(newsOption);

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveButton);

    expect(updateFeedAction).toHaveBeenCalledWith({
      id: mockSubscription.id,
      customTitle: "My Custom Title",
      categoryId: 2,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Subscription updated");
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("allows setting category to Uncategorized", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: true,
      data: { ...mockSubscription, categoryId: null } as any,
    });

    const { user } = setup();

    const selectTrigger = await screen.findByRole("combobox", {
      name: /category/i,
    });
    await user.click(selectTrigger);

    const uncategorizedOption = await screen.findByRole("option", {
      name: /uncategorized/i,
    });
    await user.click(uncategorizedOption);

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveButton);

    expect(updateFeedAction).toHaveBeenCalledWith({
      id: mockSubscription.id,
      customTitle: "My Custom Title",
      categoryId: null,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Subscription updated");
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows error toast when update fails", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: false,
      error: "Server Error",
      code: "SERVER_ERROR",
    });

    const { user } = setup();

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server Error");
    });

    // Dialog should remain open and button enabled
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
    expect(saveButton).toHaveTextContent(/save changes/i);
  });

  it("displays loading state while updating", async () => {
    let resolveAction!: (reason: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(updateFeedAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent(/saving/i);

    resolveAction({ success: true, data: mockFeed });

    await waitForElementToBeRemoved(screen.queryByRole("dialog"));
  });

  it("closes dialog when cancel is clicked", async () => {
    const { user } = setup();

    const cancelButton = await screen.findByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
