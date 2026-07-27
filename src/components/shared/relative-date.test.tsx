import * as useTickerModule from "@/hooks/use-ticker";
import { act, render, screen } from "@/tests/rtl-utils";
import { RelativeDate } from "./relative-date";

describe("RelativeDate component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders relative distance correctly for dates in the past", () => {
    const postDate = new Date("2026-07-26T11:50:00Z");

    render(<RelativeDate date={postDate} />);

    expect(screen.getByText("10 minutes ago")).toBeInTheDocument();
  });

  it("accepts ISO string input as well as Date instances", () => {
    const isoString = "2026-07-26T11:50:00Z";

    render(<RelativeDate date={isoString} />);

    expect(screen.getByText("10 minutes ago")).toBeInTheDocument();
  });

  it("supports addSuffix={false} prop", () => {
    const postDate = new Date("2026-07-26T11:50:00Z");

    render(<RelativeDate date={postDate} addSuffix={false} />);

    expect(screen.getByText("10 minutes")).toBeInTheDocument();
  });

  it("renders 'Just now' for dates less than 30 seconds", () => {
    const recentDate = new Date("2026-07-26T11:59:45Z");

    render(<RelativeDate date={recentDate} />);

    expect(screen.getByText("Just now")).toBeInTheDocument();
  });

  it("renders 'Just now' for dates in the future", () => {
    const futureDate = new Date("2026-07-26T12:05:00Z");

    render(<RelativeDate date={futureDate} />);

    expect(screen.getByText("Just now")).toBeInTheDocument();
  });

  it("automatically updates relative date text when 30 seconds pass", () => {
    const postDate = new Date("2026-07-26T11:59:45Z");

    render(<RelativeDate date={postDate} />);

    expect(screen.getByText("Just now")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("1 minute ago")).toBeInTheDocument();
  });

  it("renders skeleton fallback when nowTimestamp === 0 (SSR/unhydrated)", () => {
    vi.spyOn(useTickerModule, "useTicker").mockReturnValue(0);

    const postDate = new Date("2026-07-26T11:50:00Z");
    render(<RelativeDate date={postDate} />);

    expect(screen.getByText("Loading date...")).toBeInTheDocument();
  });

  it("handles unparseable date strings gracefully during SSR fallback", () => {
    vi.spyOn(useTickerModule, "useTicker").mockReturnValue(0);

    render(<RelativeDate date="invalid-date" />);

    const timeElement = screen.getByRole("time");
    expect(timeElement).toHaveAttribute("datetime", "");
    expect(screen.getByText("Loading date...")).toBeInTheDocument();
  });
});
