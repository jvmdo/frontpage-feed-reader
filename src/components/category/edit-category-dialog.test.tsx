import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCategoryAction } from "@/actions/category/update-category-action";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/constants";
import { createMockCategory } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import type { Category } from "@/types";
import { EditCategoryDialog } from "./edit-category-dialog";

vi.mock("@/actions/category/update-category-action", () => ({
  updateCategoryAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("EditCategoryDialog", () => {
  const category = createMockCategory({ name: "Old Name" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (cat: Category | null = category) => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<EditCategoryDialog category={cat} onOpenChange={onOpenChange} />);
    return { user, onOpenChange };
  };

  it("opens the dialog and shows the current name and color", async () => {
    setup();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue(
      "Old Name",
    );
    expect(
      screen.getByRole("button", { name: /select color/i }),
    ).toBeInTheDocument();
  });

  it("calls updateCategoryAction with new name and color when submitted", async () => {
    vi.mocked(updateCategoryAction).mockResolvedValue({
      success: true,
    });

    const { user } = setup();

    const nameInput = screen.getByRole("textbox", { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateCategoryAction).toHaveBeenCalledWith({
      id: category.id,
      name: "New Name",
      color: DEFAULT_CATEGORY_COLOR, // Default from mock
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Category updated successfully",
      );
    });
  });

  it("shows error toast when update fails", async () => {
    vi.mocked(updateCategoryAction).mockResolvedValue({
      success: false,
      error: "Duplicate name",
      code: "DUPLICATE_CATEGORY",
    });

    const { user } = setup();

    const input = screen.getByRole("textbox", { name: /name/i });
    await user.clear(input);
    await user.type(input, "New Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Duplicate name");
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows validation error for empty name", async () => {
    const { user } = setup();

    const input = screen.getByRole("textbox", { name: /name/i });
    await user.clear(input);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText(/category name is required/i),
    ).toBeInTheDocument();

    expect(updateCategoryAction).not.toHaveBeenCalled();
  });

  it("displays loading state while saving", async () => {
    const { promise, resolve } = Promise.withResolvers<any>();
    vi.mocked(updateCategoryAction).mockReturnValue(promise);

    const { user, onOpenChange } = setup();

    const input = screen.getByRole("textbox", { name: /name/i });
    await user.clear(input);
    await user.type(input, "New Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolve({ success: true, data: { ...category, name: "New Name" } });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
