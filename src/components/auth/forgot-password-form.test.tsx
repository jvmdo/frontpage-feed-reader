/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { ForgotPasswordForm } from "./forgot-password-form";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    return { user };
  };

  it("shows validation errors for empty email", async () => {
    const { user } = setup();

    const submitButton = screen.getByRole("button", {
      name: /send reset link/i,
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAccessibleDescription(
        /invalid email address/i,
      );
    });

    expect(authClient.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("shows success message on successful submission", async () => {
    vi.mocked(authClient.requestPasswordReset).mockResolvedValue({
      data: { status: true },
      error: null,
    } as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
      email: "test@example.com",
      redirectTo: "/reset-password",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /check your email/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /return to sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows error toast on failed submission", async () => {
    const errorMessage = "Failed to request password reset.";
    vi.mocked(authClient.requestPasswordReset).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    } as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(
      screen.queryByRole("heading", { name: /check your email/i }),
    ).not.toBeInTheDocument();
  });

  it("displays loading state while submitting", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(authClient.requestPasswordReset).mockReturnValue(
      pendingPromise as any,
    );

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    const submitButton = screen.getByRole("button", { name: /sending link/i });

    expect(submitButton).toBeDisabled();
    expect(
      screen.getByRole("status", { name: /loading/i }),
    ).toBeInTheDocument();

    resolveAction({ data: { status: true }, error: null });

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });
});
