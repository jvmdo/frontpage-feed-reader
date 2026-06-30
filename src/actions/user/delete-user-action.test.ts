/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { InvalidPasswordError, PasswordRequiredError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { deleteUserService } from "@/services/user/delete-user";
import { deleteUserAction } from "./delete-user-action";

vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("@/services/user/delete-user", () => ({
  deleteUserService: vi.fn(),
}));

vi.mock("next/headers", () => {
  return {
    headers: vi.fn(async () => new Headers()),
  };
});

describe("deleteUserAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await deleteUserAction({
      password: 123 as any, // force invalid type
    });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await deleteUserAction({
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete your account.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and calls deleteUserService on successful validation", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteUserService).mockResolvedValueOnce(undefined);

    const result = await deleteUserAction({
      password: "password123",
    });

    expect(result).toEqual({
      success: true,
    });
    expect(deleteUserService).toHaveBeenCalledWith(
      expect.anything(), // db
      "user-123",
      { password: "password123" },
      expect.any(Headers),
    );
  });

  it("handles PasswordRequiredError", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteUserService).mockRejectedValueOnce(
      new PasswordRequiredError(),
    );

    const result = await deleteUserAction({});

    expect(result).toEqual({
      success: false,
      error: "Current password is required to change your password.", // default error message in error class
      code: "PASSWORD_REQUIRED",
    });
  });

  it("handles InvalidPasswordError", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteUserService).mockRejectedValueOnce(
      new InvalidPasswordError(),
    );

    const result = await deleteUserAction({ password: "wrong" });

    expect(result).toEqual({
      success: false,
      error: "The password you entered is incorrect.",
      code: "INVALID_PASSWORD",
    });
  });

  it("returns internal error on unexpected errors", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteUserService).mockRejectedValueOnce(
      new Error("Unexpected crash"),
    );

    const result = await deleteUserAction({});

    expect(result).toEqual({
      success: false,
      error: "Unexpected crash",
      code: "INTERNAL_ERROR",
    });
  });
});
