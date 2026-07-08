/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { ResetPasswordForm } from "./reset-password-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

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
    resetPassword: vi.fn(),
  },
}));

describe("ResetPasswordForm", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  const setup = (token?: string) => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token={token} />);
    return { user };
  };

  it("shows error state if token is missing", () => {
    setup(undefined);

    expect(
      screen.getByRole("heading", { name: /invalid link/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for mismatching passwords", async () => {
    const { user } = setup("valid-token");

    await user.type(screen.getByLabelText(/new password/i), "123123");
    await user.type(screen.getByLabelText(/confirm password/i), "676869");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(/confirm password/i),
      ).toHaveAccessibleDescription(/passwords don't match/i);
    });

    expect(authClient.resetPassword).not.toHaveBeenCalled();
  });

  it("calls authClient.resetPassword and redirects on success", async () => {
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: { status: true },
      error: null,
    } as any);

    const { user } = setup("valid-token");

    await user.type(screen.getByLabelText(/new password/i), "123123");
    await user.type(screen.getByLabelText(/confirm password/i), "123123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(authClient.resetPassword).toHaveBeenCalledWith({
      newPassword: "123123",
      token: "valid-token",
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/sign-in");
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/password reset successfully/i),
    );
  });

  it("shows error toast on failed reset", async () => {
    const errorMessage = "The link may have expired.";
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    } as any);

    const { user } = setup("expired-token");

    await user.type(screen.getByLabelText(/new password/i), "123123");
    await user.type(screen.getByLabelText(/confirm password/i), "123123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("displays loading state while resetting", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(authClient.resetPassword).mockReturnValue(pendingPromise as any);

    const { user } = setup("valid-token");

    await user.type(screen.getByLabelText(/new password/i), "123123");
    await user.type(screen.getByLabelText(/confirm password/i), "123123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByRole("button", { name: /resetting/i })).toBeDisabled();

    resolveAction({ data: { status: true }, error: null });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/sign-in");
    });
  });
});
