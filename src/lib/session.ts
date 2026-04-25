import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  const headers = await nextHeaders();

  // Try the REAL authentication flow first.
  // This works perfectly for Production AND Playwright (because Playwright sends the cookie).
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (session) {
    return session;
  }

  if (process.env.NODE_ENV === "development") {
    const { getDevSession } = await import("@/tests/session");
    const testUserId = headers.get("x-test-user-id");
    return await getDevSession(testUserId);
  }

  // Unauthenticated
  return null;
}
