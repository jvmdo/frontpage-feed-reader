import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { createMockSessionPromise, createMockUser } from "@/tests/factories";
import { render, screen } from "@/tests/rtl-utils";
import { TopNav } from "./top-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock nextjs-toploader/app
vi.mock("nextjs-toploader/app", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

// Mock AddFeedDialog to simplify integration test
vi.mock("@/components/feed/add-feed-dialog", () => ({
  AddFeedDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("TopNav", () => {
  const mockUser = createMockUser();
  const mockSessionPromise = createMockSessionPromise(mockUser);

  it("renders branding and navigation links", () => {
    render(<TopNav sessionPromise={mockSessionPromise} />);

    // Verify branding (desktop version)
    expect(screen.getByText("Frontpage")).toBeInTheDocument();

    // Verify navigation links
    expect(screen.getByRole("link", { name: /feed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /digest/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /discover/i }),
    ).toBeInTheDocument();
  });

  it("highlights the active link based on pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    const { rerender } = render(<TopNav sessionPromise={mockSessionPromise} />);

    // Default mock is /dashboard
    const feedLink = screen.getByRole("link", { name: /feed/i });
    expect(feedLink).toHaveAttribute("aria-current", "page");

    // Change pathname to /digest
    vi.mocked(usePathname).mockReturnValue("/digest");
    rerender(<TopNav sessionPromise={mockSessionPromise} />);

    // Uncomment when Digest page is available
    // const digestLink = screen.getByRole("link", { name: /digest/i });
    // expect(digestLink).toHaveAttribute("aria-current", "page");

    expect(screen.getByRole("link", { name: /feed/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders desktop-only utilities", async () => {
    render(<TopNav sessionPromise={mockSessionPromise} />);

    // Desktop utilities are inside a hidden md:flex div
    // But RTL renders everything in a jsdom environment by default
    expect(
      screen.getByRole("button", { name: /search your articles/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/add feed/i)).toBeInTheDocument();
    expect(await screen.findByText("JD")).toBeInTheDocument(); // Avatar fallback for John Doe
  });
});
