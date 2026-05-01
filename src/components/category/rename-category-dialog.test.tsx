/** biome-ignore-all lint/suspicious/noExplicitAny: Test asset */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCategoryAction } from "@/actions/category/update-category-action";
import { createMockCategory } from "@/tests/factories";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@/tests/rtl-utils";
import { RenameCategoryDialog } from "./rename-category-dialog";

// Mock the server action
vi.mock("@/actions/category/update-category-action", () => ({
  updateCategoryAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RenameCategoryDialog", () => {
  const category = createMockCategory({ id: 1, name: "Old Name" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const user = userEvent.setup();
    render(
      <RenameCategoryDialog category={category}>
        <button type="button">Open Dialog</button>
      </RenameCategoryDialog>,
    );
    return { user };
  };

  it("opens the dialog and shows the current name", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue(
      "Old Name",
    );
  });

  it("calls updateCategoryAction with new name when submitted", async () => {
    vi.mocked(updateCategoryAction).mockResolvedValue({
      success: true,
      data: { ...category, name: "New Name" },
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    await user.clear(input);
    await user.type(input, "New Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateCategoryAction).toHaveBeenCalledWith({
      id: category.id,
      name: "New Name",
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Category renamed successfully",
      );
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows error toast when renaming fails", async () => {
    vi.mocked(updateCategoryAction).mockResolvedValue({
      success: false,
      error: "Duplicate name",
      code: "DUPLICATE_CATEGORY",
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

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

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    await user.clear(input);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText(/category name is required/i),
    ).toBeInTheDocument();

    expect(updateCategoryAction).not.toHaveBeenCalled();
  });

  it("displays loading state while saving", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(updateCategoryAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    await user.clear(input);
    await user.type(input, "New Name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolveAction({
      success: true,
      data: { ...category, name: "New Name" },
    });

    await waitForElementToBeRemoved(screen.queryByRole("dialog"));
  });
});
