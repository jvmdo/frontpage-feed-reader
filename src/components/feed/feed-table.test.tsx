import { subDays, subMinutes } from "date-fns";
import { HttpResponse, http } from "msw";
import {
  createMockCategory,
  createMockFeedWithSubscription,
} from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import type { FeedWithSubscription } from "@/types";
import { FeedTable } from "./feed-table";

const mockCategories = [
  createMockCategory({ id: 1, name: "Tech" }),
  createMockCategory({ id: 2, name: "Design" }),
];

const mockData: FeedWithSubscription[] = [
  createMockFeedWithSubscription({
    subscription: { id: 1, customTitle: "My Custom Title", categoryId: 1 },
    feed: {
      title: "Original Title 1",
      lastSuccessAt: subMinutes(new Date(), 5),
      healthStatus: "healthy",
    },
  }),
  createMockFeedWithSubscription({
    subscription: { id: 2, categoryId: 2 },
    feed: {
      title: "Feed Title 2",
      lastSuccessAt: subDays(new Date(), 2),
      healthStatus: "stale",
    },
  }),
  createMockFeedWithSubscription({
    subscription: { id: 3, categoryId: null },
    feed: {
      lastSuccessAt: subDays(new Date(), 5),
      healthStatus: "error",
    },
  }),
];

describe("FeedTable", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: mockCategories });
      }),
    );
  });

  it("renders correct table headers", async () => {
    render(<FeedTable data={mockData} />);

    expect(
      await screen.findByRole("columnheader", { name: /title/i }),
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

  it("renders custom title when provided, otherwise feed title", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText("My Custom Title")).toBeInTheDocument();
    expect(screen.queryByText("Original Title 1")).not.toBeInTheDocument();
    expect(screen.getByText("Feed Title 2")).toBeInTheDocument();
  });

  it("renders various health statuses correctly", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText(/healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/stale/i)).toBeInTheDocument();
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it("renders relative timestamps for last success", async () => {
    render(<FeedTable data={mockData} />);

    expect(await screen.findByText(/5 minutes ago/i)).toBeInTheDocument();
    expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
  });

  it("renders 'Never' when lastSuccessAt is null", async () => {
    const dataWithNullSuccess: FeedWithSubscription[] = [
      {
        ...mockData[0],
        feed: { ...mockData[0].feed, lastSuccessAt: null },
      },
    ];
    render(<FeedTable data={dataWithNullSuccess} />);

    expect(await screen.findByText(/never/i)).toBeInTheDocument();
  });
});
