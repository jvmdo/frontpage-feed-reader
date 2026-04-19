import { subDays, subMinutes } from "date-fns";
import { createMockFeedWithSubscription } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import type { FeedWithSubscription } from "@/types";
import { FeedTable } from "./feed-table";

const mockData: FeedWithSubscription[] = [
  createMockFeedWithSubscription({
    subscription: { customTitle: "My Custom Title" },
    feed: {
      title: "Original Title 1",
      lastSuccessAt: subMinutes(new Date(), 5),
      healthStatus: "healthy",
    },
  }),
  createMockFeedWithSubscription({
    feed: {
      title: "Feed Title 2",
      lastSuccessAt: subDays(new Date(), 2),
      healthStatus: "stale",
    },
  }),
  createMockFeedWithSubscription({
    feed: {
      lastSuccessAt: subDays(new Date(), 5),
      healthStatus: "error",
    },
  }),
];

describe("FeedTable", () => {
  it("renders correct table headers", () => {
    render(<FeedTable data={mockData} />);

    expect(
      screen.getByRole("columnheader", { name: /title/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /url/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /health status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /last fetched/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /actions/i }),
    ).toBeInTheDocument();
  });

  it("renders custom title when provided, otherwise feed title", () => {
    render(<FeedTable data={mockData} />);

    expect(screen.getByText("My Custom Title")).toBeInTheDocument();
    expect(screen.queryByText("Original Title 1")).not.toBeInTheDocument();
    expect(screen.getByText("Feed Title 2")).toBeInTheDocument();
  });

  it("renders various health statuses correctly", () => {
    render(<FeedTable data={mockData} />);

    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/stale/i)).toBeInTheDocument();
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it("renders relative timestamps for last success", () => {
    render(<FeedTable data={mockData} />);

    expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
    expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
  });

  it("renders 'Never' when lastSuccessAt is null", () => {
    const dataWithNullSuccess: FeedWithSubscription[] = [
      {
        ...mockData[0],
        feed: { ...mockData[0].feed, lastSuccessAt: null },
      },
    ];
    render(<FeedTable data={dataWithNullSuccess} />);

    expect(screen.getByText(/never/i)).toBeInTheDocument();
  });
});
