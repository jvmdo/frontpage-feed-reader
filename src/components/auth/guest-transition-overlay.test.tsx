import * as useSignInModule from "@/hooks/user/use-sign-in-anonymous";
import { act, render, screen } from "@/tests/rtl-utils";
import {
  GuestWorkspaceSetupOverlay,
  OVERLAY_DELAY_MS,
} from "./guest-workspace-setup-overlay";

describe("GuestTransitionOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render dialog overlay when guest sign-in is not active", () => {
    vi.spyOn(useSignInModule, "useIsSigningInAnonymous").mockReturnValue(false);

    render(<GuestWorkspaceSetupOverlay />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("delays rendering overlay for 1.5s threshold", () => {
    vi.spyOn(useSignInModule, "useIsSigningInAnonymous").mockReturnValue(true);

    render(<GuestWorkspaceSetupOverlay />);

    // Before 1.5s delay threshold
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Fast forward past 1.5s threshold
    act(() => {
      vi.advanceTimersByTime(OVERLAY_DELAY_MS);
    });

    const dialog = screen.getByRole("dialog", {
      name: /setting up your guest workspace/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("heading", { name: /setting up your guest workspace/i }),
    ).toBeInTheDocument();
  });

  it("holds overlay visible for minimum duration when operation completes shortly after 1.5s", () => {
    const isSigningInSpy = vi
      .spyOn(useSignInModule, "useIsSigningInAnonymous")
      .mockReturnValue(true);

    const { rerender } = render(<GuestWorkspaceSetupOverlay />);

    // Advance past 1.5s threshold to show overlay
    act(() => {
      vi.advanceTimersByTime(OVERLAY_DELAY_MS);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Advance 100ms so Date.now() advances to 1.6s total time
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Operation completes 100ms later (at 1.6s total time) -> returns false
    isSigningInSpy.mockReturnValue(false);
    rerender(<GuestWorkspaceSetupOverlay />);

    // Advance 1500ms (elapsed visible = 1600ms): Dialog MUST STILL be in document due to 800ms min visibility
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("cycles through editorial topic cards every 2 seconds when active", () => {
    vi.spyOn(useSignInModule, "useIsSigningInAnonymous").mockReturnValue(true);

    render(<GuestWorkspaceSetupOverlay />);

    act(() => {
      vi.advanceTimersByTime(OVERLAY_DELAY_MS);
    });

    expect(
      screen.getByText("React 19 & Server Components"),
    ).toBeInTheDocument();

    // Advance 2s to cycle to 2nd card
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByText("Distributed Systems Architecture"),
    ).toBeInTheDocument();

    // Advance 2s to cycle to 3rd card
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByText("Typography & Information Density"),
    ).toBeInTheDocument();
  });
});
