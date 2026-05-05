import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { createMockUser } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { TopNav } from "./top-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock AddFeedDialog to simplify integration test
vi.mock("@/components/feed/add-feed-dialog", () => ({
  AddFeedDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("TopNav", () => {
  const mockUser = createMockUser();

  it("renders branding and navigation links", () => {
    render(<TopNav user={mockUser} />);

    // Verify branding (desktop version)
    expect(screen.getByText("Frontpage")).toBeInTheDocument();

    // Verify navigation links
    expect(screen.getByRole("link", { name: /feed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /digest/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover/i })).toBeInTheDocument();
  });

  it("highlights the active link based on pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    const { rerender } = render(<TopNav user={mockUser} />);

    // Default mock is /dashboard
    const feedLink = screen.getByRole("link", { name: /feed/i });
    expect(feedLink).toHaveAttribute("aria-current", "page");

    // Change pathname to /digest
    vi.mocked(usePathname).mockReturnValue("/digest");
    rerender(<TopNav user={mockUser} />);

    const digestLink = screen.getByRole("link", { name: /digest/i });
    expect(digestLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /feed/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders desktop-only utilities", () => {
    render(<TopNav user={mockUser} />);

    // Desktop utilities are inside a hidden md:flex div
    // But RTL renders everything in a jsdom environment by default
    expect(screen.getByLabelText(/search articles/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/add feed/i)).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument(); // Avatar fallback for John Doe
  });
});
