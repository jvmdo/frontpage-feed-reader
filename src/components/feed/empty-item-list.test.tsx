import userEvent from "@testing-library/user-event";
import { RssIcon } from "lucide-react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEmptyItemListConfig } from "@/hooks/feed/use-empty-item-list-config";
import { render, screen } from "@/tests/rtl-utils";
import { EmptyItemList } from "./empty-item-list";

vi.mock("@/hooks/feed/use-empty-item-list-config");
vi.mock("@/components/category/assign-feeds-dialog", () => ({
  AssignFeedsDialog: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("EmptyItemList (Component Presenter)", () => {
  const defaultMock = {
    config: {
      title: "Test Empty Title",
      description: "Test Empty Description",
      icon: RssIcon,
      actionType: null as "show-read" | "show-unread" | "assign-feeds" | null,
    },
    categoryId: null as number | null,
    onShowRead: vi.fn(),
    onShowUnread: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title, description and icon", () => {
    vi.mocked(useEmptyItemListConfig).mockReturnValue(defaultMock);

    render(<EmptyItemList />);

    expect(
      screen.getByRole("heading", { name: /test empty title/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/test empty description/i)).toBeInTheDocument();
  });

  it("renders show-read action and handles click", async () => {
    const onShowRead = vi.fn();
    vi.mocked(useEmptyItemListConfig).mockReturnValue({
      ...defaultMock,
      config: {
        ...defaultMock.config,
        actionType: "show-read",
      },
      onShowRead,
    });

    render(<EmptyItemList />);

    const button = screen.getByRole("button", { name: /show read articles/i });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(onShowRead).toHaveBeenCalledTimes(1);
  });

  it("renders show-unread action and handles click", async () => {
    const onShowUnread = vi.fn();
    vi.mocked(useEmptyItemListConfig).mockReturnValue({
      ...defaultMock,
      config: {
        ...defaultMock.config,
        actionType: "show-unread",
      },
      onShowUnread,
    });

    render(<EmptyItemList />);

    const button = screen.getByRole("button", {
      name: /show unread articles/i,
    });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(onShowUnread).toHaveBeenCalledTimes(1);
  });

  it("renders assign-feeds action when actionType is assign-feeds and categoryId is present", () => {
    vi.mocked(useEmptyItemListConfig).mockReturnValue({
      ...defaultMock,
      config: {
        ...defaultMock.config,
        actionType: "assign-feeds",
      },
      categoryId: 123,
    });

    render(<EmptyItemList />);

    expect(
      screen.getByText(/assign feeds to this category to see them here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /assign feeds/i }),
    ).toBeInTheDocument();
  });
});
