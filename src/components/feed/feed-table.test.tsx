import { subDays, subMinutes } from "date-fns";
import { render, screen } from "@/tests/rtl-utils";
import type { FeedWithSubscription } from "@/types";
import { FeedTable } from "./feed-table";

const mockData: FeedWithSubscription[] = [
  {
    subscription: {
      id: 1,
      userId: "user-1",
      feedId: 1,
      categoryId: null,
      customTitle: "My Custom Title",
      ordering: 0,
      markedAllReadAt: null,
      createdAt: new Date(),
    },
    feed: {
      id: 1,
      url: "https://example.com/1",
      title: "Original Title 1",
      description: null,
      language: null,
      iconUrl: null,
      lastFetchedAt: new Date(),
      lastSuccessAt: subMinutes(new Date(), 5),
      lastFailureAt: null,
      healthStatus: "healthy",
      httpEtag: null,
      httpLastModified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    subscription: {
      id: 2,
      userId: "user-1",
      feedId: 2,
      categoryId: null,
      customTitle: null,
      ordering: 1,
      markedAllReadAt: null,
      createdAt: new Date(),
    },
    feed: {
      id: 2,
      url: "https://example.com/2",
      title: "Feed Title 2",
      description: null,
      language: null,
      iconUrl: null,
      lastFetchedAt: new Date(),
      lastSuccessAt: subDays(new Date(), 2),
      lastFailureAt: new Date(),
      healthStatus: "stale",
      httpEtag: null,
      httpLastModified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    subscription: {
      id: 3,
      userId: "user-1",
      feedId: 3,
      categoryId: null,
      customTitle: null,
      ordering: 2,
      markedAllReadAt: null,
      createdAt: new Date(),
    },
    feed: {
      id: 3,
      url: "https://example.com/3",
      title: "Feed Title 3",
      description: null,
      language: null,
      iconUrl: null,
      lastFetchedAt: new Date(),
      lastSuccessAt: subDays(new Date(), 5),
      lastFailureAt: new Date(),
      healthStatus: "error",
      httpEtag: null,
      httpLastModified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
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
