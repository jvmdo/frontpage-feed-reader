/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { SignupForm } from "./signup-form";

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
    signUp: {
      email: vi.fn(),
    },
    signIn: {
      social: vi.fn(),
      anonymous: vi.fn(),
    },
  },
}));

describe("SignupForm", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    return { user };
  };

  it("shows validation errors for empty fields", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveAccessibleDescription(
        /name is required/i,
      );
    });
    expect(screen.getByLabelText(/email/i)).toHaveAccessibleDescription(
      /invalid email address/i,
    );
    expect(screen.getByLabelText(/^password$/i)).toHaveAccessibleDescription(
      /password is required/i,
    );

    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("shows validation error for password mismatch", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password456");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(/confirm password/i),
      ).toHaveAccessibleDescription(/passwords don't match/i);
    });

    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("calls authClient.signUp.email and redirects on success", async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "password123",
      name: "John Doe",
      callbackURL: "/dashboard",
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully!",
      );
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error toast on failed sign up", async () => {
    const errorMessage = "Email already in use.";
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    } as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls authClient.signIn.social when GitHub button is clicked", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: /sign up with github/i }),
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

  it("displays loading state while creating account", async () => {
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(authClient.signUp.email).mockReturnValue(pendingPromise as any);

    const { user } = setup();

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^create account$/i }));

    const submitButton = screen.getByRole("button", {
      name: /creating account/i,
    });

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
