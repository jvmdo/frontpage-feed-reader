/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { changePasswordAction } from "@/actions/user/change-password-action";
import { authClient } from "@/lib/auth-client";
import { createMockAccount } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { PasswordChangeForm } from "./password-change-form";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    listAccounts: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/actions/user/change-password-action", () => ({
  changePasswordAction: vi.fn(),
}));

/**
 * Configures listAccounts to resolve with the given accounts for this test.
 * Must be called before render() so the Suspense query resolves with that data.
 */
function mockAccounts(accounts: ReturnType<typeof createMockAccount>[]) {
  vi.mocked(authClient.listAccounts).mockResolvedValue({
    data: accounts,
    error: null,
  } as any);
}

async function renderAndWait(ui: React.ReactElement) {
  render(<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>);
  await screen.findByRole("heading", {
    level: 2,
    name: /change|set password/i,
  });
}

describe("PasswordChangeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when the user has a credential account", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
    });

    it("renders 'Change Password'", async () => {
      await renderAndWait(<PasswordChangeForm />);

      expect(
        screen.getByRole("heading", { level: 2, name: /change password/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/update your account password/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /change password/i }),
      ).toBeInTheDocument();
    });
  });

  describe("when the user has no credential account (OAuth-only)", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "github" })]);
    });

    it("renders 'Set Password'", async () => {
      await renderAndWait(<PasswordChangeForm />);

      expect(
        screen.getByRole("heading", { level: 2, name: /set password/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/create a password to enable logging in/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /set password/i }),
      ).toBeInTheDocument();
      // does not render the 'Current Password' field
      expect(
        screen.queryByLabelText(/current password/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("form validation", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
    });

    it("shows an error when passwords do not match", async () => {
      const user = userEvent.setup();
      await renderAndWait(<PasswordChangeForm />);

      await user.type(screen.getByLabelText(/^new password/i), "abc123");
      await user.type(
        screen.getByLabelText(/confirm new password/i),
        "different",
      );
      await user.click(
        screen.getByRole("button", { name: /change password/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
      expect(changePasswordAction).not.toHaveBeenCalled();
    });
  });

  describe("form submission", () => {
    it("shows success toast and resets form when credential user succeeds", async () => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
      vi.mocked(changePasswordAction).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      await renderAndWait(<PasswordChangeForm />);

      await user.type(screen.getByLabelText(/current password/i), "123123");
      await user.type(screen.getByLabelText(/^new password/i), "abcabc");
      await user.type(screen.getByLabelText(/confirm new password/i), "abcabc");
      await user.click(screen.getByRole("button", { name: /change/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringMatching(/password changed successfully/i),
        );
      });
      // Form should reset — fields cleared
      expect(screen.getByLabelText(/^new password/i)).toHaveValue("");
    });

    it("shows success toast for OAuth-only user", async () => {
      mockAccounts([createMockAccount({ providerId: "github" })]);
      vi.mocked(changePasswordAction).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      await renderAndWait(<PasswordChangeForm />);

      await user.type(screen.getByLabelText(/^new password/i), "123123");
      await user.type(screen.getByLabelText(/confirm new password/i), "123123");
      await user.click(screen.getByRole("button", { name: /set password/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringMatching(/password set successfully/i),
        );
      });
    });

    it("shows error toast when the action returns a failure", async () => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
      vi.mocked(changePasswordAction).mockResolvedValue({
        success: false,
        error: "The current password you entered is incorrect.",
      } as any);

      const user = userEvent.setup();
      await renderAndWait(<PasswordChangeForm />);

      await user.type(screen.getByLabelText(/current password/i), "wrongpass");
      await user.type(screen.getByLabelText(/^new password/i), "123123");
      await user.type(screen.getByLabelText(/confirm new password/i), "123123");
      await user.click(screen.getByRole("button", { name: /change/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "The current password you entered is incorrect.",
        );
      });
    });

    it("disables the button and shows a spinner while pending", async () => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
      const { promise, resolve } = Promise.withResolvers<any>();
      vi.mocked(changePasswordAction).mockReturnValue(promise);

      const user = userEvent.setup();
      await renderAndWait(<PasswordChangeForm />);

      await user.type(screen.getByLabelText(/current password/i), "qwerty");
      await user.type(screen.getByLabelText(/^new password/i), "123123");
      await user.type(screen.getByLabelText(/confirm new password/i), "123123");
      await user.click(screen.getByRole("button", { name: /change/i }));

      expect(
        await screen.findByRole("button", { name: /changing/i }),
      ).toBeDisabled();

      resolve({ success: true });

      expect(
        await screen.findByRole("button", { name: /change password/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("status", { name: /loading/i }),
      ).not.toBeInTheDocument();
    });
  });
});
