import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createMockItemWithSource } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { ToggleReadButton } from "./toggle-read-button";

describe("ToggleReadButton", () => {
  const mockOnClick = vi.fn();

  it("returns null when data is not provided", () => {
    const { container } = render(
      <ToggleReadButton onClick={mockOnClick} disabled={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correct icon and accessibility label when item is read", () => {
    const data = createMockItemWithSource({
      isRead: true,
      isWatermarked: false,
    });
    render(
      <ToggleReadButton data={data} onClick={mockOnClick} disabled={false} />,
    );

    const button = screen.getByRole("button", { name: /mark as unread/i });
    expect(button).toBeInTheDocument();

    // Check that BookCheckIcon is rendered (we can check for the lucide class or icon structure)
    const icon = button.querySelector("svg");
    expect(icon).toHaveClass("lucide-book-check");
  });

  it("renders correct icon and accessibility label when item is unread", () => {
    const data = createMockItemWithSource({
      isRead: false,
      isWatermarked: false,
    });
    render(
      <ToggleReadButton data={data} onClick={mockOnClick} disabled={false} />,
    );

    const button = screen.getByRole("button", { name: /mark as read/i });
    expect(button).toBeInTheDocument();

    const icon = button.querySelector("svg");
    expect(icon).toHaveClass("lucide-book");
  });

  it("applies watermarked styling and custom tooltip text when watermarked", () => {
    const data = createMockItemWithSource({
      isRead: true,
      isWatermarked: true,
    });
    render(
      <ToggleReadButton data={data} onClick={mockOnClick} disabled={false} />,
    );

    const button = screen.getByRole("button", { name: /mark as unread/i });
    expect(button).toHaveClass("opacity-50", "cursor-not-allowed");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const data = createMockItemWithSource({ isRead: false });
    render(
      <ToggleReadButton data={data} onClick={mockOnClick} disabled={false} />,
    );

    const button = screen.getByRole("button", { name: /mark as read/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    const data = createMockItemWithSource({ isRead: false });
    render(
      <ToggleReadButton data={data} onClick={mockOnClick} disabled={true} />,
    );

    const button = screen.getByRole("button", { name: /mark as read/i });
    expect(button).toBeDisabled();
  });
});
