import { eq } from "drizzle-orm";
import { account, session, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InvalidPasswordError, PasswordRequiredError } from "@/lib/errors";
import { seedAccount } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { deleteUserService } from "./delete-user";

vi.spyOn(auth.api, "verifyPassword").mockImplementation(
  async () => ({ status: true }) as any,
);

describe("deleteUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should throw PasswordRequiredError if credential account exists but password is not provided", async ({
    tx,
    testUser,
  }) => {
    await seedAccount(tx, {
      id: "acc-1",
      userId: testUser.id,
      providerId: "credential",
    });

    const headers = new Headers();

    await expect(
      deleteUserService(tx, testUser.id, {}, headers),
    ).rejects.toThrow(PasswordRequiredError);

    expect(auth.api.verifyPassword).not.toHaveBeenCalled();
  });

  test("should throw InvalidPasswordError when verifyPassword fails", async ({
    tx,
    testUser,
  }) => {
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
      deleteUserService(
        tx,
        testUser.id,
        { password: "wrong-password" },
        headers,
      ),
    ).rejects.toThrow(InvalidPasswordError);

    expect(auth.api.verifyPassword).toHaveBeenCalled();
  });

  test("should delete user and cascade if valid password is provided for credential account", async ({
    tx,
    testUser,
  }) => {
    await seedAccount(tx, {
      id: "acc-1",
      userId: testUser.id,
      providerId: "credential",
    });

    // Seed a session
    await tx.insert(session).values({
      id: "sess-1",
      userId: testUser.id,
      token: "some-token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const headers = new Headers();

    await deleteUserService(
      tx,
      testUser.id,
      { password: "password123" },
      headers,
    );

    expect(auth.api.verifyPassword).toHaveBeenCalledWith({
      body: { password: "password123" },
      headers,
    });

    // Verify user is deleted
    const [deletedUser] = await tx
      .select()
      .from(user)
      .where(eq(user.id, testUser.id));
    expect(deletedUser).toBeUndefined();

    // Verify cascade to account
    const [deletedAccount] = await tx
      .select()
      .from(account)
      .where(eq(account.userId, testUser.id));
    expect(deletedAccount).toBeUndefined();

    // Verify cascade to session
    const [deletedSession] = await tx
      .select()
      .from(session)
      .where(eq(session.userId, testUser.id));
    expect(deletedSession).toBeUndefined();
  });

  test("should delete user directly if no credential account (e.g. OAuth/Guest)", async ({
    tx,
    testUser,
  }) => {
    await seedAccount(tx, {
      id: "acc-oauth",
      userId: testUser.id,
      providerId: "github",
    });

    const headers = new Headers();

    await deleteUserService(tx, testUser.id, {}, headers);

    expect(auth.api.verifyPassword).not.toHaveBeenCalled();

    // Verify user is deleted
    const [deletedUser] = await tx
      .select()
      .from(user)
      .where(eq(user.id, testUser.id));
    expect(deletedUser).toBeUndefined();
  });
});
