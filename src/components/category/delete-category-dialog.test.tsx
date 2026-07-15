import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteCategoryAction } from "@/actions/category/delete-category-action";
import { createMockCategory } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import type { Category } from "@/types";
import { DeleteCategoryDialog } from "./delete-category-dialog";

vi.mock("@/actions/category/delete-category-action", () => ({
  deleteCategoryAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("DeleteCategoryDialog", () => {
  const category = createMockCategory({ name: "Tech" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (cat: Category | null = category) => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<DeleteCategoryDialog category={cat} onOpenChange={onOpenChange} />);
    return { user, onOpenChange };
  };

  it("opens the confirmation dialog", async () => {
    setup();

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/are you absolutely sure\?/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently delete the/i)).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("calls deleteCategoryAction when confirmed", async () => {
    vi.mocked(deleteCategoryAction).mockResolvedValue({
      success: true,
    });

    const { user } = setup();

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

    await user.click(screen.getByRole("button", { name: /delete category/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not delete");
    });
  });

  it("displays loading state while deleting", async () => {
    const { promise, resolve } = Promise.withResolvers<any>();
    vi.mocked(deleteCategoryAction).mockReturnValue(promise);

    const { user, onOpenChange } = setup();

    await user.click(screen.getByRole("button", { name: /delete category/i }));

    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    resolve({ success: true });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
