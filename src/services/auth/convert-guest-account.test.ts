import { eq } from "drizzle-orm";
import { describe, expect } from "vitest";
import { account, session, user } from "@/db/schema";
import { test } from "@/tests/test-extend";
import { convertGuestToMember } from "./convert-guest-account";

describe("convertGuestToMember", () => {
  test("should transfer account and session to anonymous ID and upgrade user", async ({
    tx,
  }) => {
    const anonId = "anon-123";
    const newUserId = "new-456";

    // 1. Seed data directly within the transaction
    await tx.insert(user).values({
      id: anonId,
      name: "Guest",
      email: "temp@anon.com",
      isAnonymous: true,
    });

    await tx.insert(user).values({
      id: newUserId,
      name: "New Member",
      email: "member@example.com",
      isAnonymous: false,
    });

    await tx.insert(account).values({
      id: "acc-1",
      accountId: newUserId,
      providerId: "credential",
      userId: newUserId,
    });

    await tx.insert(session).values({
      id: "sess-1",
      token: "token-1",
      expiresAt: new Date(Date.now() + 10000),
      userId: newUserId,
    });

    // 2. Act
    await convertGuestToMember(tx, anonId, {
      id: newUserId,
      email: "member@example.com",
      name: "New Member",
      emailVerified: true,
      image: "https://avatar.com/img.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      isAnonymous: false,
    });

    // 3. Assert: Verify account and session were moved
    const movedAccount = await tx.query.account.findFirst({
      where: eq(account.id, "acc-1"),
    });
    expect(movedAccount?.userId).toBe(anonId);

    const movedSession = await tx.query.session.findFirst({
      where: eq(session.id, "sess-1"),
    });
    expect(movedSession?.userId).toBe(anonId);

    // 4. Assert: Verify newUser was deleted
    const deletedUser = await tx.query.user.findFirst({
      where: eq(user.id, newUserId),
    });
    expect(deletedUser).toBeUndefined();

    // 5. Assert: Verify anonUser was upgraded
    const upgradedUser = await tx.query.user.findFirst({
      where: eq(user.id, anonId),
    });
    expect(upgradedUser?.isAnonymous).toBe(false);
    expect(upgradedUser?.email).toBe("member@example.com");
    expect(upgradedUser?.name).toBe("New Member");
    expect(upgradedUser?.emailVerified).toBe(true);
    expect(upgradedUser?.image).toBe("https://avatar.com/img.png");
  });
});
