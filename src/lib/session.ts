import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  // Try the REAL authentication flow first.
  // This works perfectly for Production AND Playwright (because Playwright sends the cookie).
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return session;
  }

  if (process.env.NODE_ENV === "development") {
    const { getDevSession } = await import("@/tests/session");
    return await getDevSession();
  }

  // Unauthenticated
  return null;
}
