import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updatePreferencesAction } from "@/actions/user/update-preferences-action";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { SettingsForm } from "./settings-form";

vi.mock("@/actions/user/update-preferences-action");
vi.mock("sonner");

// Mock usePreferencesStore
const mockSetAutoMarkRead = vi.fn();
vi.mock("@/hooks/ui/use-preferences-store", () => ({
  usePreferencesStore: vi.fn((selector) =>
    selector({
      autoMarkReadMode: "immediately",
      autoMarkReadDelay: 5,
      setAutoMarkRead: mockSetAutoMarkRead,
    }),
  ),
}));

describe("SettingsForm", () => {
  const initialData = {
    refreshInterval: 900,
    autoMarkReadMode: "immediately" as const,
    autoMarkReadDelay: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PointerEvent methods for Radix UI Select in jsdom
    if (typeof window !== "undefined") {
      window.HTMLElement.prototype.hasPointerCapture = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    }
  });

  it("renders with initial data", () => {
    render(<SettingsForm initialData={initialData} />);

    expect(screen.getByLabelText(/Auto-Refresh Interval/i)).toHaveTextContent(
      /Every 15 minutes/i,
    );
    expect(screen.getByLabelText(/Auto Mark as Read/i)).toHaveTextContent(
      /Immediately on open/i,
    );
    // Delay input should NOT be visible initially because mode is "immediately"
    expect(
      screen.queryByLabelText(/Delay \(seconds\)/i),
    ).not.toBeInTheDocument();
  });

  it("submits the form and shows success toast", async () => {
    vi.mocked(updatePreferencesAction).mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<SettingsForm initialData={initialData} />);

    // Change Auto-Refresh Interval
    await user.click(screen.getByLabelText(/Auto-Refresh Interval/i));
    await user.click(screen.getByRole("option", { name: /Every 30 minutes/i }));

    // Change Reading Behaviour to delayed
    await user.click(screen.getByLabelText(/Auto Mark as Read/i));
    await user.click(screen.getByRole("option", { name: /After a delay/i }));

    // Delay input should become visible
    const delayInput = await screen.findByLabelText(/Delay \(seconds\)/i);
    await user.clear(delayInput);
    await user.type(delayInput, "7");

    // Click submit
    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    expect(updatePreferencesAction).toHaveBeenCalledWith({
      refreshInterval: 1800,
      autoMarkReadMode: "delayed",
      autoMarkReadDelay: 7,
    });
    expect(mockSetAutoMarkRead).toHaveBeenCalledWith("delayed", 7);
    expect(toast.success).toHaveBeenCalledWith(
      "Settings updated successfully.",
    );
  });

  it("shows error toast on submission failure", async () => {
    vi.mocked(updatePreferencesAction).mockResolvedValue({
      success: false,
      error: "Something went wrong",
      code: "INTERNAL_ERROR",
    });
    const user = userEvent.setup();

    render(<SettingsForm initialData={initialData} />);

    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("syncs initial preferences data to Zustand store on mount", () => {
    render(<SettingsForm initialData={initialData} />);
    expect(mockSetAutoMarkRead).toHaveBeenCalledWith("immediately", 5);
  });

  it("toggles delay input visibility based on select selection", async () => {
    const user = userEvent.setup();
    render(<SettingsForm initialData={initialData} />);

    // 1. Initially hidden (mode is "immediately")
    expect(
      screen.queryByLabelText(/Delay \(seconds\)/i),
    ).not.toBeInTheDocument();

    // 2. Select "After a delay" -> Should become visible
    await user.click(screen.getByLabelText(/Auto Mark as Read/i));
    await user.click(screen.getByRole("option", { name: /After a delay/i }));
    expect(
      await screen.findByLabelText(/Delay \(seconds\)/i),
    ).toBeInTheDocument();

    // 3. Select "Manual only" -> Should be hidden again
    await user.click(screen.getByLabelText(/Auto Mark as Read/i));
    await user.click(screen.getByRole("option", { name: /Manual only/i }));
    expect(
      screen.queryByLabelText(/Delay \(seconds\)/i),
    ).not.toBeInTheDocument();
  });

  it("disables inputs and shows loading state on submit", async () => {
    const { promise, resolve } = Promise.withResolvers<any>();
    vi.mocked(updatePreferencesAction).mockReturnValue(promise);
    const user = userEvent.setup();

    render(<SettingsForm initialData={initialData} />);

    const submitButton = screen.getByRole("button", { name: /Save changes/i });
    await user.click(submitButton);

    // Assert loading state on submit button
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/Saving/i);

    // Assert initial state on submit button
    resolve({ success: true });

    waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent(/Save/i);
    });
  });

  it("shows validation error message when delay is out of range", async () => {
    const user = userEvent.setup();
    render(<SettingsForm initialData={initialData} />);

    // Open delay field by choosing "delayed" mode
    await user.click(screen.getByLabelText(/Auto Mark as Read/i));
    await user.click(screen.getByRole("option", { name: /After a delay/i }));

    const delayInput = await screen.findByLabelText(/Delay \(seconds\)/i);

    await user.clear(delayInput);
    await user.type(delayInput, "70");
    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    expect(
      screen.getByText(/Delay must be at most 60 seconds/i),
    ).toBeInTheDocument();
    expect(updatePreferencesAction).not.toHaveBeenCalled();
  });
});
