/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCategoryAction } from "@/actions/category/create-category-action";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@/tests/rtl-utils";
import { AddCategoryDialog } from "./add-category-dialog";

// Mock the server action
vi.mock("@/actions/category/create-category-action", () => ({
  createCategoryAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AddCategoryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<AddCategoryDialog>Open Dialog</AddCategoryDialog>);
    return { user };
  };

  it("opens the dialog when the trigger is clicked", async () => {
    const { user } = setup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /add category/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error for empty name", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(/category name is required/i),
    ).toBeInTheDocument();
    expect(createCategoryAction).not.toHaveBeenCalled();
  });

  it("shows validation error for name longer than 50 characters", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(input, "a".repeat(51));
    await user.click(submitButton);

    expect(
      await screen.findByText(/category name must be less than 50 characters/i),
    ).toBeInTheDocument();
    expect(createCategoryAction).not.toHaveBeenCalled();
  });

  it("calls createCategoryAction and shows success toast on valid submission", async () => {
    const categoryName = "New Category";

    vi.mocked(createCategoryAction).mockResolvedValue({
      success: true,
      data: { id: 1, name: categoryName } as any,
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(input, categoryName);
    await user.click(submitButton);

    expect(createCategoryAction).toHaveBeenCalledExactlyOnceWith({
      name: categoryName,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledExactlyOnceWith(
        "Category created successfully",
      );
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays a loading state while the action is pending", async () => {
    const categoryName = "New Category";

    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(createCategoryAction).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(input, categoryName);
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/creating/i);

    resolveAction({ success: true, data: { id: 1, name: categoryName } });

    await waitForElementToBeRemoved(screen.queryByRole("dialog"));
  });

  it("shows error toast when action fails", async () => {
    const errorMessage = "Category name already exists";
    vi.mocked(createCategoryAction).mockResolvedValue({
      success: false,
      error: errorMessage,
      code: "CATEGORY_EXISTS",
    });

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const input = screen.getByRole("textbox", { name: /name/i });
    const submitButton = screen.getByRole("button", {
      name: /create category/i,
    });

    await user.type(input, "Duplicate Category");
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledExactlyOnceWith(errorMessage);
    });

    // Dialog should stay open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
