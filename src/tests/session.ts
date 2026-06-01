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

/**
 * Creates a real session in the database and returns the session cookies.
 * These cookies should be injected into Playwright or the response.
 */
export async function createPlaywrightSession(userId: string) {
  const { test: authTest } = await auth.$context;
  const email = `test-${userId}@example.com`;

  await ensureUserExists(authTest, {
    id: userId,
    email,
    name: "Playwright User",
  });

  const cookies = await authTest.getCookies({
    userId,
    domain: "localhost",
  });

  return {
    user: { id: userId, email },
    testCookies: cookies,
    authTest,
  };
}
