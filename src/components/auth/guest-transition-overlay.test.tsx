import { usePathname } from "next/navigation";
import * as useSignInModule from "@/hooks/user/use-sign-in-anonymous";
import { act, render, screen } from "@/tests/rtl-utils";
import {
  GuestTransitionOverlay,
  MIN_VISIBILITY_MS,
  OVERLAY_DELAY_MS,
} from "./guest-transition-overlay";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

describe("GuestTransitionOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render dialog overlay when sign in is not active", () => {
    vi.spyOn(useSignInModule, "useIsSigningInAnonymous").mockReturnValue(false);

    render(<GuestTransitionOverlay />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("delays rendering overlay for 1.5s (Phase 1 threshold)", () => {
    vi.spyOn(useSignInModule, "useIsSigningInAnonymous").mockReturnValue(true);

    render(<GuestTransitionOverlay />);

    // Fast condition (<1.5s): Overlay should not be visible yet
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Fast forward past 1.5s threshold
    act(() => {
      vi.advanceTimersByTime(OVERLAY_DELAY_MS);
    });

    expect(
      screen.getByRole("dialog", { name: /setting up guest session/i }),
    ).toBeInTheDocument();
  });

  it("keeps overlay open during long-running operations (e.g. 10s)", () => {
    const isSigningInSpy = vi
      .spyOn(useSignInModule, "useIsSigningInAnonymous")
      .mockReturnValue(true);

    const { rerender } = render(<GuestTransitionOverlay />);

    // Advance past 1.5s threshold
    act(() => {
      vi.advanceTimersByTime(OVERLAY_DELAY_MS);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Fast forward 8.5 seconds (total 10s) while still signing in
    act(() => {
      vi.advanceTimersByTime(8500);
    });
    // Overlay MUST remain visible throughout long process
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Operation completes at 10s
    isSigningInSpy.mockReturnValue(false);
    rerender(<GuestTransitionOverlay />);

    // Dismisses immediately because 600ms quota was already fulfilled
    act(() => {
      vi.advanceTimersByTime(0);
    });

    vi.useRealTimers();
  });

  it("enforces minimum visibility duration of 600ms once shown (Option A)", () => {
    const isSigningInSpy = vi
      .spyOn(useSignInModule, "useIsSigningInAnonymous")
      .mockReturnValue(true);

    const { rerender } = render(<GuestTransitionOverlay />);

    // Advance past 1.5s so overlay becomes visible
    act(() => {
      vi.advanceTimersByTime(OVERLAY_DELAY_MS);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Simulate sign-in completing 100ms later (at 1.6s total time)
    isSigningInSpy.mockReturnValue(false);
    rerender(<GuestTransitionOverlay />);

    // Advance 100ms: Overlay should STILL be in document due to 600ms minimum visibility
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Advance past remaining 500ms minimum visibility
    act(() => {
      vi.advanceTimersByTime(MIN_VISIBILITY_MS);
    });

    vi.useRealTimers();
  });

  it("resets store state when route changes away from landing page", () => {
    vi.spyOn(useSignInModule, "useIsSigningInAnonymous").mockReturnValue(true);

    const { rerender } = render(<GuestTransitionOverlay />);

    // Simulate navigating to /dashboard
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    rerender(<GuestTransitionOverlay />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
