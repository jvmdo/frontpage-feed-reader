import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { updatePreferencesAction } from "@/actions/user/update-preferences-action";
import { SettingsForm } from "./settings-form";

vi.mock("@/actions/user/update-preferences-action");
vi.mock("sonner");

describe("SettingsForm", () => {
  const initialData = {
    refreshInterval: 900,
  };

  it("renders with initial data", () => {
    render(<SettingsForm initialData={initialData} />);

    expect(screen.getByLabelText(/Auto-Refresh Interval/i)).toHaveTextContent(
      /Every 15 minutes/i,
    );
  });

  it("submits the form and shows success toast", async () => {
    vi.mocked(updatePreferencesAction).mockResolvedValue({ success: true });

    render(<SettingsForm initialData={initialData} />);

    const select = screen.getByLabelText(/Auto-Refresh Interval/i);
    fireEvent.change(select, { target: { value: "900" } });

    const submitButton = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updatePreferencesAction).toHaveBeenCalledWith({
        refreshInterval: 900,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Settings updated successfully.",
      );
    });
  });

  it("shows error toast on submission failure", async () => {
    vi.mocked(updatePreferencesAction).mockResolvedValue({
      success: false,
      error: "Something went wrong",
      code: "INTERNAL_ERROR",
    });

    render(<SettingsForm initialData={initialData} />);

    const submitButton = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
