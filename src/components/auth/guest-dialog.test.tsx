/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { GuestDialog } from "./guest-dialog";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

describe("GuestDialog", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (open = true) => {
    const user = userEvent.setup();
    render(<GuestDialog open={open} onOpenChange={mockOnOpenChange} />);
    return { user };
  };

  it("shows validation error for empty email", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(/email address/i),
      ).toHaveAccessibleDescription(/invalid email address/i);
    });

    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("calls authClient.signUp.email and shows success toast on success", async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);

    const { user } = setup();

    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(authClient.signUp.email).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "john@example.com",
        name: "Guest User",
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/account created successfully/i),
        expect.any(Object),
      );
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error toast on failed conversion", async () => {
    const errorMessage = "Email already in use.";
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    } as any);

    const { user } = setup();

    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  it("displays loading state while converting", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(authClient.signUp.email).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolveAction({ data: { session: {} }, error: null });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
