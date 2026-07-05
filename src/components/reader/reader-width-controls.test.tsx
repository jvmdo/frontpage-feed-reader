import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useReaderStore } from "@/hooks/ui/use-reader-store";
import { render, screen } from "@/tests/rtl-utils";
import { ReaderWidthControls } from "./reader-width-controls";

describe("ReaderWidthControls", () => {
  beforeEach(() => {
    useReaderStore.getState().setReaderWidth("50vw");
  });

  it("updates reader width preference on click", async () => {
    const user = userEvent.setup();
    render(<ReaderWidthControls />);

    const toggleButtons = screen.getAllByRole("radio");
    expect(toggleButtons).toHaveLength(3);

    // Click the 65vw toggle button (the second radio item)
    await user.click(toggleButtons[1]);

    // Verify store was updated
    expect(useReaderStore.getState().readerWidth).toBe("65vw");
  });
});
