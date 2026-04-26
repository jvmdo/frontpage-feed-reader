import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/rtl-utils";
import { TopNav } from "./top-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock AddFeedDialog to simplify integration test
vi.mock("@/components/feed/add-feed-dialog", () => ({
  AddFeedDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("TopNav", () => {
  it("renders branding and navigation links", () => {
    render(<TopNav />);

    // Verify branding (desktop version)
    expect(screen.getByText("Frontpage")).toBeInTheDocument();

    // Verify navigation links
    expect(screen.getByRole("link", { name: /feed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /digest/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover/i })).toBeInTheDocument();
  });

  it("highlights the active link based on pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    const { rerender } = render(<TopNav />);

    // Default mock is /dashboard
    const feedLink = screen.getByRole("link", { name: /feed/i });
    expect(feedLink).toHaveAttribute("aria-current", "page");

    // Change pathname to /digest
    vi.mocked(usePathname).mockReturnValue("/digest");
    rerender(<TopNav />);

    const digestLink = screen.getByRole("link", { name: /digest/i });
    expect(digestLink).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /feed/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders desktop-only utilities", () => {
    render(<TopNav />);

    // Desktop utilities are inside a hidden md:flex div
    // But RTL renders everything in a jsdom environment by default
    expect(screen.getByLabelText(/search articles/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/add feed/i)).toBeInTheDocument();
    expect(screen.getByText("MS")).toBeInTheDocument(); // Avatar fallback
  });
});
