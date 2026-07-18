import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { render, screen } from "@/tests/rtl-utils";
import { OneClickAuth } from "./one-click-auth";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { social: vi.fn(), anonymous: vi.fn() },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("OneClickAuth", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  const setup = () => {
    const user = userEvent.setup();
    render(<OneClickAuth />);
    return { user };
  };

  it("calls authClient.signIn.social when GitHub button is clicked", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: /sign in with github/i }),
    );

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/dashboard",
    });
  });

  it("calls authClient.signIn.anonymous when guest button is clicked", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /try as guest/i }));

    expect(authClient.signIn.anonymous).toHaveBeenCalled();
  });
});
