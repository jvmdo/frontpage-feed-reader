import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
  }),
}));

import { authClient } from "@/lib/auth-client";
import { createMockUser } from "@/tests/factories";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { UserMenu } from "./user-menu";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("nextjs-toploader/app", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: vi.fn() })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn(), signOut: vi.fn() },
}));

vi.mock("@/hooks/ui/use-tour-store", () => ({
  useTourStore: vi.fn((selector) => selector({ reset: vi.fn() })),
}));

describe("UserMenu Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      error: null,
    } as any);
    vi.mocked(authClient.signOut).mockResolvedValue({
      data: true,
      error: null,
    } as any);
  });

  const setupUser = (isAnonymous: boolean) => {
    const user = createMockUser({ isAnonymous });
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user },
      error: null,
    } as any);
    return user;
  };

  it("renders user avatar and initials fallback", async () => {
    const user = setupUser(false);
    render(<UserMenu user={user} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("opens menu and shows user info on click", async () => {
    const user = setupUser(false);
    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));

    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it("signs out immediately for regular members without showing guest warning", async () => {
    const user = setupUser(false);
    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    await actor.click(screen.getByRole("menuitem", { name: /log out/i }));

    expect(authClient.signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/sign-in");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog for guest users when logging out", async () => {
    const user = setupUser(true);
    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    await actor.click(screen.getByRole("menuitem", { name: /log out/i }));

    expect(authClient.signOut).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/permanently delete your guest session data/i),
    ).toBeInTheDocument();
  });

  it("allows guest users to cancel warning and save progress", async () => {
    const user = setupUser(true);
    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    await actor.click(screen.getByRole("menuitem", { name: /log out/i }));

    await actor.click(screen.getByRole("button", { name: /save progress/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
  });

  it("allows guest users to confirm logout and delete data", async () => {
    const user = setupUser(true);
    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    await actor.click(screen.getByRole("menuitem", { name: /log out/i }));

    await actor.click(screen.getByRole("button", { name: /yes, goodbye!/i }));

    expect(authClient.signOut).toHaveBeenCalled();

    expect(mockPush).toHaveBeenCalledWith("/sign-in");
  });

  it("shows loading state while logging out", async () => {
    const user = setupUser(false);
    const { promise, resolve } = Promise.withResolvers<any>();
    vi.mocked(authClient.signOut).mockReturnValue(promise);

    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    await actor.click(screen.getByRole("menuitem", { name: /log out/i }));

    // The menu closes automatically. Reopen it to check the pending state.
    await actor.click(screen.getByRole("button", { name: /user menu/i }));

    expect(
      screen.getByRole("menuitem", { name: /logging out/i }),
    ).toBeInTheDocument();

    // Clean up to resolve the pending query client state
    resolve({ data: true, error: null });
  });

  it("shows error toast when sign out fails", async () => {
    const user = setupUser(false);
    vi.mocked(authClient.signOut).mockResolvedValue({
      data: null,
      error: { message: "Network connection lost." },
    } as any);

    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    await actor.click(screen.getByRole("menuitem", { name: /log out/i }));

    expect(toast.error).toHaveBeenCalledWith("Network connection lost.");
  });

  it("allows selecting a theme", async () => {
    const user = setupUser(false);
    const actor = userEvent.setup();
    render(<UserMenu user={user} />);

    await actor.click(screen.getByRole("button", { name: /user menu/i }));
    const darkItem = screen.getByRole("radio", { name: /dark theme/i });
    await actor.click(darkItem);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
