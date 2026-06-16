/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/rtl-utils";
import { FeedIcon } from "./feed-icon";

// Mock the shadcn Avatar components to bypass JSDOM's lack of image loading lifecycles
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className, style }: any) => (
    <div className={className} style={style} data-testid="avatar-root">
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt, onLoadingStatusChange, className }: any) => (
    // biome-ignore lint/performance/noImgElement: testing asset
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => onLoadingStatusChange?.("error")}
      onLoad={() => onLoadingStatusChange?.("loaded")}
    />
  ),
  AvatarFallback: ({ children, className, style }: any) => (
    <span className={className} style={style} data-testid="avatar-fallback">
      {children}
    </span>
  ),
}));

describe("FeedIcon", () => {
  it("caches broken icons and falls back to text initials on image load error", () => {
    const brokenUrl = "https://example.com/broken.png";

    // 1. First render: image starts loading
    const { rerender } = render(<FeedIcon url={brokenUrl} title="Verge" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();

    // 2. Simulate image load error
    fireEvent.error(img);

    // 3. Image should be unmounted and fallback rendered
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("V")).toBeInTheDocument();

    // 4. Second render (or rendering in another component with the same URL):
    // Should immediately render fallback without creating an image element
    rerender(<FeedIcon url={brokenUrl} title="Verge" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("V")).toBeInTheDocument();
  });
});
