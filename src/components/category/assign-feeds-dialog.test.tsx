import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSubscriptionAction } from "@/actions/feed/update-subscription-action";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { AssignFeedsDialog } from "./assign-feeds-dialog";

// Mock the server action
vi.mock("@/actions/feed/update-subscription-action", () => ({
  updateSubscriptionAction: vi.fn(),
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
      subscription: { id: 3, categoryId: 10 }, // Already in Tech
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

  it("opens the dialog and lists subscriptions with their current categories", async () => {
    const { user } = setup();

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/assign feeds to tech/i)).toBeInTheDocument();

    // Check Feed 1 (Uncategorized)
    expect(screen.getByText("Feed 1")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move feed 1 to tech/i }),
    ).toBeInTheDocument();

    // Check Feed 2 (Design)
    expect(screen.getByText("Feed 2")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move feed 2 to tech/i }),
    ).toBeInTheDocument();

    // Check Feed 3 (Already in Tech)
    expect(screen.getByText("Feed 3")).toBeInTheDocument();
    expect(screen.getByText("In Category")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /move feed 3 to tech/i }),
    ).not.toBeInTheDocument();
  });

  it("calls updateSubscriptionAction when 'Move' is clicked", async () => {
    const { user } = setup();
    vi.mocked(updateSubscriptionAction).mockResolvedValue({
      success: true,
      data: { id: 1, categoryId: targetCategoryId } as any,
    });

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const moveButton = await screen.findByRole("button", {
      name: /move feed 1 to tech/i,
    });
    await user.click(moveButton);

    expect(updateSubscriptionAction).toHaveBeenCalledWith({
      id: 1,
      categoryId: targetCategoryId,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Feed moved to category");
    });
  });

  it("shows error toast when movement fails", async () => {
    const { user } = setup();
    vi.mocked(updateSubscriptionAction).mockResolvedValue({
      success: false,
      error: "Something went wrong",
      code: "ERROR",
    });

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const moveButton = await screen.findByRole("button", {
      name: /move feed 1 to tech/i,
    });
    await user.click(moveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("displays loading state while moving a feed", async () => {
    const { user } = setup();

    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });
    vi.mocked(updateSubscriptionAction).mockReturnValue(pendingPromise as any);

    await user.click(
      await screen.findByRole("button", { name: /open dialog/i }),
    );

    const moveButton = await screen.findByRole("button", {
      name: /move feed 1 to tech/i,
    });
    await user.click(moveButton);

    expect(moveButton).toBeDisabled();
    expect(screen.getByText(/moving feed 1.../i)).toBeInTheDocument();

    resolveAction({
      success: true,
      data: { id: 1, categoryId: targetCategoryId },
    });

    await waitFor(() => {
      expect(moveButton).toBeEnabled();
    });
  });
});
