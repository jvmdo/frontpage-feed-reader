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
    await authTest.saveUser(authTest.createUser(user));
  }
}

export async function getDevSession() {
  const { test: authTest } = await auth.$context;
  const DEV_USER_ID = "dev-user-id";

  await ensureUserExists(authTest, {
    id: DEV_USER_ID,
    email: "dev@localhost",
    name: "Dev User",
  });

  const headers = await authTest.getAuthHeaders({ userId: DEV_USER_ID });
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
