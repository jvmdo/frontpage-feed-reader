/** biome-ignore-all lint/suspicious/noExplicitAny: Tests */

import userEvent from "@testing-library/user-event";
import { useUserAccounts } from "@/hooks/user/use-user-accounts";
import { authClient } from "@/lib/auth-client";
import { createMockUser } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { ProfileClient } from "./profile-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    listAccounts: vi.fn(),
  },
}));

vi.mock("./profile-form", () => ({
  ProfileForm: () => <div data-testid="profile-form">Profile Form</div>,
}));

vi.mock("./email-change-form", () => ({
  EmailChangeForm: () => {
    useUserAccounts();
    return <div data-testid="email-change-form">Email Change Form</div>;
  },
}));

vi.mock("./password-change-form", () => ({
  PasswordChangeForm: () => {
    useUserAccounts();
    return <div data-testid="password-change-form">Password Change Form</div>;
  },
}));

vi.mock("./oauth-providers", () => ({
  OAuthProviders: () => {
    useUserAccounts();
    return <div data-testid="oauth-providers">OAuth Providers</div>;
  },
}));

vi.mock("./delete-account-form", () => ({
  DeleteAccountForm: () => {
    useUserAccounts();
    return <div data-testid="delete-account-form">Delete Account Form</div>;
  },
}));

describe("ProfileClient Integration & Error Boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser = createMockUser({ isAnonymous: false });

  it("renders error fallbacks only for account-dependent sections when accounts query fails", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: mockUser, session: {} },
    } as any);

    // Mock accounts listing error which will trigger the boundary
    vi.mocked(authClient.listAccounts).mockResolvedValue({
      data: null,
      error: new Error("Auth API Error"),
    } as any);

    render(<ProfileClient user={mockUser} />);

    // Profile form should still render fine (no dependency on listAccounts)
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();

    // Verification of the customized fallback cards for the account settings
    expect(
      await screen.findByText("Email Settings Unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Password Settings Unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Connected Accounts Unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("Danger Zone Unavailable")).toBeInTheDocument();

    // Verify fallback contains a local retry button
    const retryButtons = screen.getAllByRole("button", {
      name: /retry loading section/i,
    });
    expect(retryButtons).toHaveLength(4);
  });

  it("recovers and renders components after error fallback retry click", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: mockUser, session: {} },
    } as any);

    let callCount = 0;
    vi.mocked(authClient.listAccounts).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { data: null, error: new Error("Auth API Error") } as any;
      }
      return { data: [], error: null } as any;
    });

    render(<ProfileClient user={mockUser} />);

    // Renders error fallbacks on first render
    const retryButtons = await screen.findAllByRole("button", {
      name: /retry loading section/i,
    });
    expect(retryButtons).toHaveLength(4);

    // Click retry on all sections
    const user = userEvent.setup();
    for (const btn of retryButtons) {
      await user.click(btn);
    }

    // All boundaries should reset and recover
    expect(await screen.findByTestId("email-change-form")).toBeInTheDocument();
    expect(
      await screen.findByTestId("password-change-form"),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("oauth-providers")).toBeInTheDocument();
    expect(
      await screen.findByTestId("delete-account-form"),
    ).toBeInTheDocument();
  });
});
