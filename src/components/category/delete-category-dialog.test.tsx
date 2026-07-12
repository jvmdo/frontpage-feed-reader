/** biome-ignore-all lint/suspicious/noExplicitAny: Test asset */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteCategoryAction } from "@/actions/category/delete-category-action";
import { createMockCategory } from "@/tests/factories";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@/tests/rtl-utils";
import { DeleteCategoryDialog } from "./delete-category-dialog";

// Mock the server action
vi.mock("@/actions/category/delete-category-action", () => ({
  deleteCategoryAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DeleteCategoryDialog", () => {
  const category = createMockCategory({ id: 1, name: "Tech" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const user = userEvent.setup();
    render(
      <DeleteCategoryDialog category={category}>
        <button type="button">Open Dialog</button>
      </DeleteCategoryDialog>,
    );
    return { user };
  };

  it("opens the confirmation dialog", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/are you absolutely sure\?/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently delete the/i)).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("calls deleteCategoryAction when confirmed", async () => {
    vi.mocked(deleteCategoryAction).mockResolvedValue({
      success: true,
      data: category,
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    await user.click(screen.getByRole("button", { name: /delete category/i }));

    expect(deleteCategoryAction).toHaveBeenCalledWith({
      id: category.id,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Category deleted successfully",
      );
    });
  });

  it("shows error toast when deletion fails", async () => {
    vi.mocked(deleteCategoryAction).mockResolvedValue({
      success: false,
      error: "Could not delete",
      code: "INTERNAL_ERROR",
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    await user.click(screen.getByRole("button", { name: /delete category/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not delete");
    });
  });

  it("displays loading state while deleting", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(deleteCategoryAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    await user.click(screen.getByRole("button", { name: /delete category/i }));

    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    resolveAction({ success: true });

    await waitForElementToBeRemoved(screen.queryByRole("alertdialog"));
  });
});
