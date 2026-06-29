/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import {
  CredentialAccountRequiredError,
  EmailAlreadyInUseError,
  InvalidPasswordError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { updateUserEmail } from "@/services/user/update-user-email";
import { changeEmailAction } from "./change-email-action";

vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("@/services/user/update-user-email", () => ({
  updateUserEmail: vi.fn(),
}));
vi.mock("next/headers", () => {
  return {
    headers: vi.fn(async () => new Headers()),
  };
});

describe("changeEmailAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await changeEmailAction({
      newEmail: "invalid-email",
      password: "",
    });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await changeEmailAction({
      newEmail: "new@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update your email.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and calls updateUserEmail on successful validation", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserEmail).mockResolvedValueOnce(undefined);

    const result = await changeEmailAction({
      newEmail: "new@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: true,
    });
    expect(updateUserEmail).toHaveBeenCalledWith(
      expect.anything(), // db
      "user-123",
      { newEmail: "new@example.com", password: "password123" },
      expect.any(Headers),
    );
  });

  it("handles EmailAlreadyInUseError", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserEmail).mockRejectedValueOnce(
      new EmailAlreadyInUseError(),
    );

    const result = await changeEmailAction({
      newEmail: "new@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "This email is already in use by another account.",
      code: "EMAIL_ALREADY_IN_USE",
    });
  });

  it("handles CredentialAccountRequiredError", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserEmail).mockRejectedValueOnce(
      new CredentialAccountRequiredError(),
    );

    const result = await changeEmailAction({
      newEmail: "new@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "You must set a password before changing your email.",
      code: "METHOD_NOT_ALLOWED",
    });
  });

  it("handles InvalidPasswordError", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserEmail).mockRejectedValueOnce(
      new InvalidPasswordError(),
    );

    const result = await changeEmailAction({
      newEmail: "new@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "The password you entered is incorrect.",
      code: "INVALID_PASSWORD",
    });
  });

  it("returns internal error on unexpected errors", async () => {
    const mockSession = { user: { id: "user-123", email: "old@example.com" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserEmail).mockRejectedValueOnce(
      new Error("Unexpected crash"),
    );

    const result = await changeEmailAction({
      newEmail: "new@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "Unexpected crash",
      code: "INTERNAL_ERROR",
    });
  });
});
