/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { eq } from "drizzle-orm";
import { account, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  CredentialAccountRequiredError,
  EmailAlreadyInUseError,
  InvalidPasswordError,
} from "@/lib/errors";
import { seedAccount, seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { updateUserEmail } from "./update-user-email";

// Mock auth.api functions
vi.spyOn(auth.api, "verifyPassword").mockImplementation(
  async () => ({ status: true }) as any,
);
vi.spyOn(auth.api, "changeEmail").mockImplementation(
  async () => ({ status: true }) as any,
);

describe("updateUserEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should throw EmailAlreadyInUseError if new email is taken", async ({
    tx,
    testUser,
  }) => {
    // Seed another user with the target email
    await seedUser(tx, {
      id: "other-user",
      email: "taken@example.com",
      name: "Other User",
    });

    const headers = new Headers();

    await expect(
      updateUserEmail(
        tx,
        testUser.id,
        {
          newEmail: "taken@example.com",
          password: "password123",
        },
        headers,
      ),
    ).rejects.toThrow(EmailAlreadyInUseError);

    expect(auth.api.verifyPassword).not.toHaveBeenCalled();
    expect(auth.api.changeEmail).not.toHaveBeenCalled();
  });

  test("should throw CredentialAccountRequiredError if user has no credential account", async ({
    tx,
    testUser,
  }) => {
    // Do not seed credential account. Seed github account instead.
    await seedAccount(tx, {
      id: "acc-oauth",
      userId: testUser.id,
      providerId: "github",
    });

    const headers = new Headers();

    await expect(
      updateUserEmail(
        tx,
        testUser.id,
        {
          newEmail: "new@example.com",
          password: "password123",
        },
        headers,
      ),
    ).rejects.toThrow(CredentialAccountRequiredError);

    expect(auth.api.verifyPassword).not.toHaveBeenCalled();
    expect(auth.api.changeEmail).not.toHaveBeenCalled();
  });

  test("should throw InvalidPasswordError when verifyPassword fails", async ({
    tx,
    testUser,
  }) => {
    // Seed credential account
    await seedAccount(tx, {
      id: "acc-1",
      userId: testUser.id,
      providerId: "credential",
    });

    vi.mocked(auth.api.verifyPassword).mockRejectedValueOnce(
      new Error("Invalid password"),
    );

    const headers = new Headers();

    await expect(
      updateUserEmail(
        tx,
        testUser.id,
        {
          newEmail: "new@example.com",
          password: "wrong-password",
        },
        headers,
      ),
    ).rejects.toThrow(InvalidPasswordError);

    expect(auth.api.verifyPassword).toHaveBeenCalled();
    expect(auth.api.changeEmail).not.toHaveBeenCalled();
  });

  test("should call auth.api.changeEmail on happy path", async ({
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

    await updateUserEmail(
      tx,
      testUser.id,
      {
        newEmail: "new@example.com",
        password: "password123",
      },
      headers,
    );

    expect(auth.api.verifyPassword).toHaveBeenCalledWith({
      body: { password: "password123" },
      headers,
    });
    expect(auth.api.changeEmail).toHaveBeenCalledWith({
      body: { newEmail: "new@example.com" },
      headers,
    });
  });

  test("should fallback to direct DB update if verification email isn't enabled", async ({
    tx,
    testUser,
  }) => {
    // Seed credential account
    await seedAccount(tx, {
      id: "acc-1",
      userId: testUser.id,
      providerId: "credential",
    });

    // Mock changeEmail to throw the specific BAD_REQUEST error
    const error = new Error("Verification email isn't enabled") as any;
    error.status = "BAD_REQUEST";
    error.body = { message: "Verification email isn't enabled" };
    vi.mocked(auth.api.changeEmail).mockRejectedValueOnce(error);

    const headers = new Headers();

    await updateUserEmail(
      tx,
      testUser.id,
      {
        newEmail: "new@example.com",
        password: "password123",
      },
      headers,
    );

    expect(auth.api.changeEmail).toHaveBeenCalled();

    // Verify DB was updated
    const [updatedUser] = await tx
      .select()
      .from(user)
      .where(eq(user.id, testUser.id))
      .limit(1);

    expect(updatedUser.email).toBe("new@example.com");

    const [updatedAccount] = await tx
      .select()
      .from(account)
      .where(eq(account.id, "acc-1"))
      .limit(1);

    expect(updatedAccount.accountId).toBe("new@example.com");
  });
});
