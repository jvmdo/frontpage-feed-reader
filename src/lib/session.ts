import { headers as nextHeaders } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Shared session detection logic that exclusively relies on Better Auth
 * session management (cookie-based).
 */
export async function getSessionFromHeaders(headers: Headers) {
  return await auth.api.getSession({
    headers,
  });
}

/**
 * For use in Server Components, Actions, and Route Handlers.
 * Leverages React 'cache' for per-request deduplication.
 */
export const getCurrentSession = cache(async () => {
  const headers = await nextHeaders();
  return getSessionFromHeaders(headers);
});
