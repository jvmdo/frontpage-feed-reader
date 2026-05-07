import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { render, screen, within } from "@/tests/rtl-utils";
import { GuestBanner } from "./guest-banner";

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

describe("GuestBanner", () => {
  const setup = (isAnonymous = true) => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { isAnonymous }, session: {} },
    } as any);

    const userEventInstance = userEvent.setup();
    render(<GuestBanner />);
    return { userEvent: userEventInstance };
  };

  it("renders the banner when user is anonymous", async () => {
    setup(true);

    // Verify banner is visible
    expect(
      screen.getByText(/you are using a guest session/i),
    ).toBeInTheDocument();
  });

  it("does not render when user is NOT anonymous", async () => {
    setup(false);

    expect(
      screen.queryByText(/you are using a guest session/i),
    ).not.toBeInTheDocument();
  });

  it("opens the real GuestDialog when clicked", async () => {
    const { userEvent } = setup(true);

    // Click the banner to open the dialog
    await userEvent.click(
      screen.getByRole("button", {
        name: /you are using a guest session/i,
      }),
    );

    // Verify the real GuestDialog is rendered (checking for its specific heading)
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
  });

  it("dismisses the banner when the X button is clicked", async () => {
    const { userEvent } = setup(true);

    const dismissButton = screen.getByRole("button", { name: /dismiss banner/i });
    await userEvent.click(dismissButton);

    expect(
      screen.queryByText(/you are using a guest session/i),
    ).not.toBeInTheDocument();
  });

  it("dismisses the banner when 'Ok, got it' is clicked inside the dialog", async () => {
    const { userEvent } = setup(true);

    // Open dialog
    await userEvent.click(
      screen.getByRole("button", {
        name: /you are using a guest session/i,
      }),
    );

    // Find the "Ok, got it" button in the dialog footer
    const dismissButton = await screen.findByRole("button", { name: /ok, got it/i });
    await userEvent.click(dismissButton);

    // Verify both banner and dialog are gone
    expect(
      screen.queryByText(/you are using a guest session/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
