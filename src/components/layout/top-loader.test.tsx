import { describe, expect, it, vi } from "vitest";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { render } from "@/tests/rtl-utils";
import { TopLoader } from "./top-loader";

vi.mock("nextjs-toploader", () => ({
  default: () => <div data-testid="next-top-loader" />,
}));

describe("TopLoader", () => {
  it("renders NextTopLoader when tour is inactive", () => {
    useTourStore.setState({ isTourActive: false });
    const { queryByTestId } = render(<TopLoader />);
    expect(queryByTestId("next-top-loader")).not.toBeNull();
  });

  it("returns null when tour is active", () => {
    useTourStore.setState({ isTourActive: true });
    const { queryByTestId } = render(<TopLoader />);
    expect(queryByTestId("next-top-loader")).toBeNull();
  });
});
