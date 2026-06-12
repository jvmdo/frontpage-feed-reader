/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { GuestButton } from "./guest-button";

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

    expect(toast.success).toHaveBeenCalledWith("Signed in as guest!");
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
    let resolveAction!: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });

    vi.mocked(authClient.signIn.anonymous).mockReturnValue(
      pendingPromise as any,
    );

    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    const guestButton = screen.getByRole("button", {
      name: /signing in as guest/i,
    });

    const loadingIndicator = screen.getByRole("status", { name: /loading/i });

    expect(guestButton).toContainElement(loadingIndicator);

    resolveAction({ data: { session: {} }, error: null });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
