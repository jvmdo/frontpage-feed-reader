/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { createMockAccount } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { OAuthProviders } from "./oauth-providers";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    listAccounts: vi.fn(),
    unlinkAccount: vi.fn().mockResolvedValue({}),
    linkSocial: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
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

async function renderAndWait() {
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthProviders />
    </Suspense>,
  );
  // Wait for the Suspense boundary to resolve — the GitHub label is hardcoded
  // in the component and appears once the accounts query settles.
  await screen.findByText("GitHub");
}

describe("OAuthProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when GitHub is linked", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "github" })]);
    });

    it("shows 'Connected to GitHub' status", async () => {
      await renderAndWait();

      expect(screen.getByText(/connected to github/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /disconnect/i }),
      ).toBeInTheDocument();
    });
  });

  describe("when GitHub is not linked", () => {
    beforeEach(() => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);
    });

    it("shows 'Not connected' status", async () => {
      await renderAndWait();

      expect(screen.getByText(/not connected/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /connect/i }),
      ).toBeInTheDocument();
    });
  });

  describe("unlinking GitHub", () => {
    it("calls unlinkAccount, shows success toast, and status flips to 'Not connected'", async () => {
      // After unlink, the invalidated query refetches — return no accounts
      vi.mocked(authClient.listAccounts)
        .mockResolvedValueOnce({
          data: [createMockAccount({ providerId: "github" })],
        })
        .mockResolvedValueOnce({});

      const user = userEvent.setup();
      await renderAndWait();

      await user.click(screen.getByRole("button", { name: /disconnect/i }));

      await waitFor(() => {
        expect(authClient.unlinkAccount).toHaveBeenCalledWith({
          providerId: "github",
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/unlinked successfully/i),
      );

      // Reactivity: after query invalidation and refetch the status updates
      await screen.findByText(/not connected/i);
    });

    it("shows error toast when unlinkAccount fails", async () => {
      mockAccounts([createMockAccount({ providerId: "github" })]);
      vi.mocked(authClient.unlinkAccount).mockResolvedValue({
        error: { message: "Cannot unlink your only sign-in method." },
      } as any);

      const user = userEvent.setup();
      await renderAndWait();

      await user.click(screen.getByRole("button", { name: /disconnect/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Cannot unlink your only sign-in method.",
        );
      });
    });
  });

  describe("linking GitHub", () => {
    it("calls linkSocial when 'Connect' is clicked", async () => {
      mockAccounts([createMockAccount({ providerId: "credential" })]);

      const user = userEvent.setup();
      await renderAndWait();

      await user.click(screen.getByRole("button", { name: /connect/i }));

      await waitFor(() => {
        expect(authClient.linkSocial).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: "github",
            callbackURL: "/profile",
          }),
        );
      });
    });
  });

  describe("pending state", () => {
    it("disables the button and shows a spinner while an operation is in-flight", async () => {
      // After unlink, the invalidated query refetches — return no accounts
      vi.mocked(authClient.listAccounts)
        .mockResolvedValueOnce({
          data: [createMockAccount({ providerId: "github" })],
        })
        .mockResolvedValueOnce({});

      const { promise, resolve } = Promise.withResolvers<any>();
      vi.mocked(authClient.unlinkAccount).mockReturnValue(promise);

      const user = userEvent.setup();
      await renderAndWait();

      await user.click(screen.getByRole("button", { name: /disconnect/i }));

      expect(
        screen.getByRole("button", { name: /disconnecting/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("status", { name: /loading/i }),
      ).toBeInTheDocument();

      resolve({ data: {}, error: null });

      expect(
        await screen.findByRole("button", { name: /connect$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("status", { name: /loading/i }),
      ).not.toBeInTheDocument();
    });
  });
});
