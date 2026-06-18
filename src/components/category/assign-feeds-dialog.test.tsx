/** biome-ignore-all lint/suspicious/noExplicitAny: test assets */

import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateFeedAction } from "@/actions/feed/update-feed-action";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor, within } from "@/tests/rtl-utils";
import { AssignFeedsDialog } from "./assign-feeds-dialog";

// Mock the server action
vi.mock("@/actions/feed/update-feed-action", () => ({
  updateFeedAction: vi.fn(),
}));
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

describe("AssignFeedsDialog", () => {
  const targetCategoryId = 10;
  const targetCategory = createMockCategory({
    id: targetCategoryId,
    name: "Tech",
  });
  const otherCategory = createMockCategory({ id: 20, name: "Design" });

  const mockSubscriptions = [
    createMockFeedWithSubscription({
      feed: { title: "Feed 1" },
      subscription: { id: 1, categoryId: null }, // Uncategorized
    }),
    createMockFeedWithSubscription({
      feed: { title: "Feed 2" },
      subscription: { id: 2, categoryId: 20 }, // In Design
    }),
    createMockFeedWithSubscription({
      feed: { title: "Feed 3" },
      subscription: { id: 3, categoryId: targetCategoryId }, // Already in Tech
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: mockSubscriptions });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: [targetCategory, otherCategory],
        });
      }),
    );

    // Mock PointerEvent methods for Radix UI Select
    if (typeof window !== "undefined") {
      window.HTMLElement.prototype.hasPointerCapture = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    }
  });

  const setup = () => {
    const user = userEvent.setup();
    render(
      <AssignFeedsDialog categoryId={targetCategoryId}>
        <button type="button">Open Dialog</button>
      </AssignFeedsDialog>,
    );
    return { user };
  };

  it("opens the dialog and groups subscriptions correctly", async () => {
    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /manage feeds in tech/i }),
    ).toBeInTheDocument();

    // Check "In this category" section
    expect(
      screen.getByRole("heading", { name: /in this category/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Feed 3")).toBeInTheDocument();
    expect(screen.getByText("Currently in this category")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove feed 3 from category/i }),
    ).toBeInTheDocument();

    // Check "Available feeds" section
    expect(
      screen.getByRole("heading", { name: /available feeds/i }),
    ).toBeInTheDocument();

    // Check Feed 1 (Uncategorized)
    expect(screen.getByText("Feed 1")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move feed 1 to category/i }),
    ).toBeInTheDocument();

    // Check Feed 2 (Design)
    expect(screen.getByText("Feed 2")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move feed 2 to category/i }),
    ).toBeInTheDocument();
  });

  it("calls updateFeedAction with null when 'Remove' is clicked", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: true,
      data: { id: 3, categoryId: targetCategoryId, customTitle: null } as any,
    });

    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const removeButton = await screen.findByRole("button", {
      name: /remove feed 3 from category/i,
    });

    await user.click(removeButton);

    expect(updateFeedAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 3,
        categoryId: null,
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Feed removed from category");
    });
  });

  it("calls updateFeedAction when 'Move' is clicked", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: true,
      data: { id: 1, categoryId: targetCategoryId } as any,
    });

    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const moveButton = await screen.findByRole("button", {
      name: /move feed 1 to category/i,
    });

    await user.click(moveButton);

    expect(updateFeedAction).toHaveBeenCalledWith({
      id: 1,
      categoryId: targetCategoryId,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Feed moved to category");
    });
  });

  it("shows error toast when movement fails", async () => {
    vi.mocked(updateFeedAction).mockResolvedValue({
      success: false,
      error: "Something went wrong",
      code: "ERROR",
    });

    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const moveButton = await screen.findByRole("button", {
      name: /move feed 1 to category/i,
    });

    await user.click(moveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("displays loading state while moving a feed", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(updateFeedAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const moveButton = await screen.findByRole("button", {
      name: /move feed 1 to category/i,
    });

    await user.click(moveButton);

    expect(moveButton).toBeDisabled();
    expect(within(moveButton).getByText(/moving/i)).toBeInTheDocument();

    resolveAction({
      success: true,
      data: { id: 1, categoryId: targetCategoryId },
    });

    await waitFor(() => {
      expect(moveButton).toBeEnabled();
    });
  });

  it("displays loading state while removing a feed", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(updateFeedAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const removeButton = await screen.findByRole("button", {
      name: /remove feed 3 from category/i,
    });
    await user.click(removeButton);

    expect(removeButton).toBeDisabled();
    expect(within(removeButton).getByText(/removing/i)).toBeInTheDocument();

    resolveAction({
      success: true,
      data: { id: 3, categoryId: null },
    });

    await waitFor(() => {
      expect(removeButton).toBeEnabled();
    });
  });

  it("renders empty state with Add Feed button when user has no feeds", async () => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify empty state is displayed
    expect(screen.getByText(/no feeds available/i)).toBeInTheDocument();

    // Verify Add Feed button is visible inside the dialog
    const addFeedBtn = screen.getByRole("button", { name: /add a feed/i });
    expect(addFeedBtn).toBeInTheDocument();

    // Click "Add Feed" and verify it opens the Add Feed Dialog (checking for its title)
    await user.click(addFeedBtn);
    expect(
      await screen.findByRole("heading", { name: /^add feed$/i }),
    ).toBeInTheDocument();
  });
});
