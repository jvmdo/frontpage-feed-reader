/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { createMockUser } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { ProfileForm } from "./profile-form";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    updateUser: vi.fn().mockResolvedValue({}),
  },
}));

function mockSession(overrides: Parameters<typeof createMockUser>[0] = {}) {
  const user = createMockUser(overrides);
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user, session: {} as any },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  } as any);
  return user;
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("guest user", () => {
    it("shows 'Temporary Guest' badge and 'Save Progress' button", () => {
      const userMock = mockSession({ isAnonymous: true });
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      expect(screen.getByText(/temporary guest/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save progress/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/^member$/i)).not.toBeInTheDocument();
    });

    it("opens GuestDialog when 'Save Progress' is clicked", async () => {
      const user = userEvent.setup();
      const userMock = mockSession({ isAnonymous: true });
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      await user.click(screen.getByRole("button", { name: /save progress/i }));

      expect(
        screen.getByRole("dialog", { name: /create an account/i }),
      ).toBeInTheDocument();
    });
  });

  describe("member user", () => {
    it("shows 'Member' badge without 'Save Progress' button", () => {
      const userMock = mockSession({ isAnonymous: false });
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      expect(screen.getByText(/^member$/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /save progress/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("form validation", () => {
    it("shows error and does not call updateUser when name is too short", async () => {
      const user = userEvent.setup();
      const userMock = mockSession();
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      const nameInput = screen.getByLabelText(/display name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "A");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
      });
      expect(authClient.updateUser).not.toHaveBeenCalled();
    });

    it("shows error when image URL is invalid", async () => {
      const user = userEvent.setup();
      const userMock = mockSession();
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      await user.type(screen.getByLabelText(/avatar image url/i), "not-a-url");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid image url/i)).toBeInTheDocument();
      });
      expect(authClient.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("form submission", () => {
    it("calls updateUser with form values and shows success toast on success", async () => {
      const user = userEvent.setup();
      const userMock = mockSession({ name: "Jane Doe" });
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      const nameInput = screen.getByLabelText(/display name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Updated");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(authClient.updateUser).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Jane Updated" }),
        );
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/profile updated/i),
      );
    });

    it("shows error toast when updateUser fails", async () => {
      vi.mocked(authClient.updateUser).mockResolvedValue({
        error: { message: "Something went wrong" },
      });

      const user = userEvent.setup();
      const userMock = mockSession();
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });

    it("disables button and shows spinner while pending", async () => {
      const { promise, resolve } = Promise.withResolvers<any>();
      vi.mocked(authClient.updateUser).mockReturnValue(promise);

      const user = userEvent.setup();
      const userMock = mockSession();
      render(<ProfileForm user={{ ...userMock, createdAt: new Date() }} />);

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

      resolve({ data: {}, error: null });

      expect(
        await screen.findByRole("button", { name: /save/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("status", { name: /loading/i }),
      ).not.toBeInTheDocument();
    });
  });
});
