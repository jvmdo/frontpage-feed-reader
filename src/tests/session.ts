import { db } from "@/db";
import { auth } from "@/lib/auth";

type AuthTest = Awaited<typeof auth.$context>["test"];

async function ensureUserExists(
  authTest: AuthTest,
  user: { id: string; email: string; name: string },
) {
  const existing = await db.query.user.findFirst({
    where: (t, { eq }) => eq(t.id, user.id),
  });
  if (!existing) {
    try {
      await authTest.saveUser(authTest.createUser(user));
    } catch {
      // Ignore errors if user was created by a concurrent request (very common during Playwright tests)
      // We don't rethrow because as long as the user exists, the test can proceed
    }
  }
}

export async function getDevSession(userId?: string | null) {
  const { test: authTest } = await auth.$context;
  const targetUserId = userId ?? "dev-user-id";
  const isDevUser = targetUserId === "dev-user-id";

  await ensureUserExists(authTest, {
    id: targetUserId,
    email: isDevUser ? "dev@localhost" : `test-${targetUserId}@example.com`,
    name: isDevUser ? "Dev User" : "Playwright User",
  });

  const headers = await authTest.getAuthHeaders({ userId: targetUserId });
  return auth.api.getSession({ headers });
}

export async function createPlaywrightSession(userId: string) {
  const { test: authTest } = await auth.$context;
  const email = `test-${userId}@example.com`;

  await ensureUserExists(authTest, {
    id: userId,
    email,
    name: "Playwright User",
  });

  const headers = await authTest.getAuthHeaders({ userId });
  const cookieStr = headers.get("cookie") || headers.get("set-cookie");

  if (!cookieStr) {
    throw new Error(
      "[createPlaywrightSession] Failed to generate session cookie",
    );
  }

  const tokenMatch = cookieStr.match(/better-auth\.session_token=([^;]+)/);

  return {
    user: { id: userId, email },
    sessionToken: tokenMatch?.[1] ?? null,
    authTest,
  };
}
