import { beforeEach, describe, expect, vi } from "vitest";
import { auth } from "@/lib/auth";
import { PasswordRequiredError } from "@/lib/errors";
import { seedAccount } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { updateUserPassword } from "./update-user-password";

// Mock auth.api functions
vi.spyOn(auth.api, "changePassword").mockImplementation(
  async () => ({}) as ReturnType<typeof auth.api.changePassword>,
);
vi.spyOn(auth.api, "setPassword").mockImplementation(
  async () => ({}) as ReturnType<typeof auth.api.setPassword>,
);

describe("updateUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should throw PasswordRequiredError if credential account exists but currentPassword is not provided", async ({
    tx,
    testUser,
  }) => {
    // Seed credential account
    await seedAccount(tx, {
      id: "acc-1",
      userId: testUser.id,
      providerId: "credential",
    });

    const headers = new Headers();

    await expect(
      updateUserPassword(
        tx,
        testUser.id,
        {
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        },
        headers,
      ),
    ).rejects.toThrow(PasswordRequiredError);

    // Also with empty currentPassword
    await expect(
      updateUserPassword(
        tx,
        testUser.id,
        {
          currentPassword: "   ",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        },
        headers,
      ),
    ).rejects.toThrow(PasswordRequiredError);

    expect(auth.api.changePassword).not.toHaveBeenCalled();
    expect(auth.api.setPassword).not.toHaveBeenCalled();
  });

  test("should call auth.api.changePassword if credential account exists and currentPassword is provided", async ({
    tx,
    testUser,
  }) => {
    // Seed credential account
    await seedAccount(tx, {
      id: "acc-1",
      userId: testUser.id,
      providerId: "credential",
    });

    const headers = new Headers();

    await updateUserPassword(
      tx,
      testUser.id,
      {
        currentPassword: "oldpassword123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      },
      headers,
    );

    expect(auth.api.changePassword).toHaveBeenCalledWith({
      body: {
        currentPassword: "oldpassword123",
        newPassword: "newpassword123",
      },
      headers,
    });
    expect(auth.api.setPassword).not.toHaveBeenCalled();
  });

  test("should call auth.api.setPassword if credential account does not exist", async ({
    tx,
    testUser,
  }) => {
    // Do not seed credential account. (Maybe seed an OAuth account instead, or none at all)
    await seedAccount(tx, {
      id: "acc-oauth",
      userId: testUser.id,
      providerId: "github",
    });

    const headers = new Headers();

    await updateUserPassword(
      tx,
      testUser.id,
      {
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      },
      headers,
    );

    expect(auth.api.setPassword).toHaveBeenCalledWith({
      body: {
        newPassword: "newpassword123",
      },
      headers,
    });
    expect(auth.api.changePassword).not.toHaveBeenCalled();
  });
});
