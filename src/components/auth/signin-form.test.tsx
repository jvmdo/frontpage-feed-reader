import userEvent from "@testing-library/user-event";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { SigninForm } from "./signin-form";

vi.mock("nextjs-toploader/app", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
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

  it("displays loading state while signing in", async () => {
    const { promise, resolve } = Promise.withResolvers<any>();
    vi.mocked(authClient.signIn.email).mockReturnValue(promise);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    resolve({ data: { session: {} }, error: null });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
