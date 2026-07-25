/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useSidebar } from "@/components/ui/sidebar";
import { createMockSessionPromise, createMockUser } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { MobileBottomNav } from "./mobile-bottom-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock nextjs-toploader/app
vi.mock("nextjs-toploader/app", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

// Mock useSidebar
vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: vi.fn(),
}));

// Mock AddFeedDialog to simplify integration test
vi.mock("@/components/feed/add-feed-dialog", () => ({
  AddFeedDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="add-feed-dialog">{children}</div>
  ),
}));

// Mock FeedMenu to simplify integration test
vi.mock("@/components/layout/components/feed-menu", () => ({
  FeedMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="feed-menu">{children}</div>
  ),
}));

describe("MobileBottomNav", () => {
  const mockUser = createMockUser();
  const mockSessionPromise = createMockSessionPromise(mockUser);

  it("renders all navigation items", () => {
    vi.mocked(useSidebar).mockReturnValue({ toggleSidebar: vi.fn() } as any);

    render(<MobileBottomNav sessionPromise={mockSessionPromise} />);

    expect(screen.getByLabelText(/open sidebar menu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search your items/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/add new feed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/feed menu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument();
  });

  it("calls toggleSidebar when menu button is clicked", async () => {
    const toggleSidebar = vi.fn();
    vi.mocked(useSidebar).mockReturnValue({ toggleSidebar } as any);
    const user = userEvent.setup();

    render(<MobileBottomNav sessionPromise={mockSessionPromise} />);

    const menuButton = screen.getByLabelText(/open sidebar menu/i);
    await user.click(menuButton);

    expect(toggleSidebar).toHaveBeenCalled();
  });

  it("wraps AddFeedDialog around the add button", () => {
    vi.mocked(useSidebar).mockReturnValue({ toggleSidebar: vi.fn() } as any);

    render(<MobileBottomNav sessionPromise={mockSessionPromise} />);

    const dialogWrapper = screen.getByTestId("add-feed-dialog");
    expect(dialogWrapper).toContainElement(
      screen.getByLabelText(/add new feed/i),
    );
  });

  it("wraps FeedMenu around the more button", () => {
    vi.mocked(useSidebar).mockReturnValue({ toggleSidebar: vi.fn() } as any);

    render(<MobileBottomNav sessionPromise={mockSessionPromise} />);

    const menuWrapper = screen.getByTestId("feed-menu");
    expect(menuWrapper).toContainElement(screen.getByLabelText(/feed menu/i));
  });
});
