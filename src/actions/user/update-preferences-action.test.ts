/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { updateUserPreferences } from "@/services/user/update-user-preferences";
import { updatePreferencesAction } from "./update-preferences-action";

vi.mock("@/services/user/update-user-preferences");
vi.mock("@/lib/session");

describe("updatePreferencesAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await updatePreferencesAction({
      refreshInterval: -1,
    } as any);

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await updatePreferencesAction({ refreshInterval: 900 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update preferences.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success when preference update is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    const input = { refreshInterval: 1800 };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserPreferences).mockResolvedValueOnce({} as any);

    const result = await updatePreferencesAction(input);

    expect(result).toEqual({
      success: true,
    });
    expect(updateUserPreferences).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      input,
    );
  });

  it("returns internal error on unexpected errors", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateUserPreferences).mockRejectedValueOnce(
      new Error("DB Down"),
    );

    const result = await updatePreferencesAction({ refreshInterval: 3600 });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred while updating preferences.",
      code: "INTERNAL_ERROR",
    });
  });
});
