/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { changeEmailAction } from "@/actions/user/change-email-action";
import { authClient } from "@/lib/auth-client";
import { createMockAccount } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { EmailChangeForm } from "./email-change-form";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({
      refetch: vi.fn(),
    })),
    listAccounts: vi.fn(),
  },
}));

vi.mock("@/actions/user/change-email-action", () => ({
  changeEmailAction: vi.fn(),
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
    name: /Change Email Address/i,
  });
}

describe("EmailChangeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render the form if the user does not have a credential account", async () => {
    mockAccounts([createMockAccount({ providerId: "github" })]);

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EmailChangeForm />
      </Suspense>,
    );

    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: /Change Email Address/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders form elements correctly", async () => {
    mockAccounts([createMockAccount({ providerId: "credential" })]);
    await renderAndWait(<EmailChangeForm />);

    expect(
      screen.getByRole("heading", { level: 2, name: /change email address/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/new email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update email/i }),
    ).toBeInTheDocument();
  });

  describe("form validation", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
    });

    it("shows error for invalid email formats", async () => {
      const user = userEvent.setup();
      await renderAndWait(<EmailChangeForm />);

      const emailInput = screen.getByLabelText(/new email address/i);
      await user.type(emailInput, "not-a-valid-email");
      await user.click(screen.getByRole("button", { name: /update email/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
      expect(changeEmailAction).not.toHaveBeenCalled();
    });

    it("shows error for empty password", async () => {
      const user = userEvent.setup();
      await renderAndWait(<EmailChangeForm />);

      const emailInput = screen.getByLabelText(/new email address/i);
      await user.type(emailInput, "valid@example.com");
      await user.click(screen.getByRole("button", { name: /update email/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
      expect(changeEmailAction).not.toHaveBeenCalled();
    });
  });

  describe("form submission", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
    });

    it("calls changeEmailAction and shows success toast on success", async () => {
      vi.mocked(changeEmailAction).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      await renderAndWait(<EmailChangeForm />);

      await user.type(
        screen.getByLabelText(/new email address/i),
        "new@example.com",
      );
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /update email/i }));

      await waitFor(() => {
        expect(changeEmailAction).toHaveBeenCalledWith({
          newEmail: "new@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringMatching(/email address updated successfully/i),
        );
      });

      // Inputs should be cleared
      expect(screen.getByLabelText(/new email address/i)).toHaveValue("");
    });

    it("shows error toast when changeEmailAction returns a failure", async () => {
      vi.mocked(changeEmailAction).mockResolvedValue({
        success: false,
        error: "This email is already in use by another account.",
      } as any);

      const user = userEvent.setup();
      await renderAndWait(<EmailChangeForm />);

      await user.type(
        screen.getByLabelText(/new email address/i),
        "inuse@example.com",
      );
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /update email/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "This email is already in use by another account.",
        );
      });
    });

    it("disables the submit button and shows loading state while pending", async () => {
      const { promise, resolve } = Promise.withResolvers<any>();
      vi.mocked(changeEmailAction).mockReturnValue(promise);

      const user = userEvent.setup();
      await renderAndWait(<EmailChangeForm />);

      await user.type(
        screen.getByLabelText(/new email address/i),
        "loading@example.com",
      );
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /update email/i }));

      expect(
        await screen.findByRole("button", { name: /updating/i }),
      ).toBeDisabled();

      resolve({ success: true });

      await waitFor(() => {
        expect(
          screen.queryByRole("status", { name: /loading/i }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
