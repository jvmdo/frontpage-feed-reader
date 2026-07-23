import userEvent from "@testing-library/user-event";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { GuestButton } from "./guest-button";

// Mock nextjs-toploader/app
vi.mock("nextjs-toploader/app", () => ({
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
      anonymous: vi.fn(),
    },
  },
}));

describe("GuestButton", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<GuestButton />);
    return { user };
  };

  it("calls authClient.signIn.anonymous and redirects on success", async () => {
    vi.mocked(authClient.signIn.anonymous).mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    expect(authClient.signIn.anonymous).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast on failed anonymous sign in", async () => {
    const errorMessage = "Something went wrong.";
    vi.mocked(authClient.signIn.anonymous).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    } as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("displays loading state while signing in", async () => {
    const { promise, resolve } = Promise.withResolvers<any>();

    vi.mocked(authClient.signIn.anonymous).mockReturnValue(promise as any);

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    const guestButton = screen.getByRole("button", {
      name: /signing in as guest/i,
    });

    const loadingIndicator = screen.getByRole("status", { name: /loading/i });

    expect(guestButton).toContainElement(loadingIndicator);

    resolve({ data: { session: {} }, error: null });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
