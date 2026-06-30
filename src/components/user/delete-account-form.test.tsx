/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteUserAction } from "@/actions/user/delete-user-action";
import { authClient } from "@/lib/auth-client";
import { createMockAccount } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { DeleteAccountForm } from "./delete-account-form";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({
      refetch: vi.fn(),
    })),
    listAccounts: vi.fn(),
  },
}));

vi.mock("@/actions/user/delete-user-action", () => ({
  deleteUserAction: vi.fn(),
}));

/**
 * Configures listAccounts to resolve with the given accounts for this test.
 */
function mockAccounts(accounts: ReturnType<typeof createMockAccount>[]) {
  vi.mocked(authClient.listAccounts).mockResolvedValue({
    data: accounts,
    error: null,
  } as any);
}

async function renderAndWait(ui: React.ReactElement) {
  render(<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>);
  // We wait for the suspense query to resolve
  await screen.findByRole("heading", {
    level: 2,
    name: /Danger Zone/i,
  });
}

describe("DeleteAccountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders danger zone with delete button", async () => {
    mockAccounts([createMockAccount({ providerId: "github" })]);
    await renderAndWait(<DeleteAccountForm />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Account" }),
    ).toBeInTheDocument();
  });

  it("shows password confirmation for credential users", async () => {
    mockAccounts([createMockAccount({ providerId: "credential" })]);
    await renderAndWait(<DeleteAccountForm />);

    const triggerButton = screen.getByRole("button", {
      name: "Delete Account",
    });

    const user = userEvent.setup();
    await user.click(triggerButton);

    expect(
      await screen.findByRole("heading", { name: "Are you absolutely sure?" }),
    ).toBeInTheDocument();

    const passwordInput = screen.getByLabelText(/Confirm Password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it("does not show password field for oauth-only users", async () => {
    mockAccounts([createMockAccount({ providerId: "github" })]);
    await renderAndWait(<DeleteAccountForm />);

    const triggerButton = screen.getByRole("button", {
      name: "Delete Account",
    });

    const user = userEvent.setup();
    await user.click(triggerButton);

    expect(
      await screen.findByRole("heading", { name: "Are you absolutely sure?" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText(/Confirm Password/i),
    ).not.toBeInTheDocument();
  });

  it("calls deleteUserAction with password when submitted by credential user", async () => {
    vi.mocked(deleteUserAction).mockResolvedValue({ success: true } as any);
    mockAccounts([createMockAccount({ providerId: "credential" })]);
    await renderAndWait(<DeleteAccountForm />);

    const triggerButton = screen.getByRole("button", {
      name: "Delete Account",
    });
    const user = userEvent.setup();
    await user.click(triggerButton);

    const passwordInput = await screen.findByLabelText(/Confirm Password/i);
    await user.type(passwordInput, "my-password");

    const confirmButton = screen.getByRole("button", {
      name: "Yes, delete my account",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteUserAction).toHaveBeenCalledWith({
        password: "my-password",
      });
    });
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/Account deleted successfully/i),
    );
  });

  it("calls deleteUserAction without password when submitted by oauth user", async () => {
    vi.mocked(deleteUserAction).mockResolvedValue({ success: true } as any);
    mockAccounts([createMockAccount({ providerId: "github" })]);
    await renderAndWait(<DeleteAccountForm />);

    const triggerButton = screen.getByRole("button", {
      name: "Delete Account",
    });
    const user = userEvent.setup();
    await user.click(triggerButton);

    const confirmButton = await screen.findByRole("button", {
      name: "Yes, delete my account",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteUserAction).toHaveBeenCalledWith({
        password: "", // empty default
      });
    });
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/Account deleted successfully/i),
    );
  });

  it("shows error toast when password is wrong", async () => {
    vi.mocked(deleteUserAction).mockResolvedValue({
      success: false,
      error: "Invalid password",
    } as any);
    mockAccounts([createMockAccount({ providerId: "credential" })]);
    await renderAndWait(<DeleteAccountForm />);

    const triggerButton = screen.getByRole("button", {
      name: "Delete Account",
    });
    const user = userEvent.setup();
    await user.click(triggerButton);

    const confirmButton = await screen.findByRole("button", {
      name: "Yes, delete my account",
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/invalid password/i),
      );
    });
  });
});
