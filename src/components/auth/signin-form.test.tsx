/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { SigninForm } from "./signin-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
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
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
      anonymous: vi.fn(),
    },
  },
}));

describe("SigninForm", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<SigninForm />);
    return { user };
  };

  it("shows validation errors for empty fields", async () => {
    const { user } = setup();

    const submitButton = screen.getByRole("button", { name: /^sign in$/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAccessibleDescription(
        /invalid email address/i,
      );
    });

    expect(screen.getByLabelText(/^password$/i)).toHaveAccessibleDescription(
      /password is required/i,
    );

    expect(authClient.signIn.email).not.toHaveBeenCalled();
  });

  it("calls authClient.signIn.email and redirects on success", async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      callbackURL: "/dashboard",
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    expect(toast.success).toHaveBeenCalledWith("Signed in successfully!");
  });

  it("shows error toast on failed sign in", async () => {
    const errorMessage = "Invalid email or password.";
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    } as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls authClient.signIn.social when GitHub button is clicked", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: /sign in with github/i }),
    );

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/dashboard",
    });
  });

  it("calls authClient.signIn.anonymous when guest button is clicked", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    expect(authClient.signIn.anonymous).toHaveBeenCalled();
  });

  it("displays loading state while signing in", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(authClient.signIn.email).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    const submitButton = screen.getByRole("button", { name: /signing in/i });

    expect(submitButton).toBeDisabled();
    expect(
      screen.getByRole("status", { name: /loading/i }),
    ).toBeInTheDocument();

    resolveAction({ data: { session: {} }, error: null });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
