import { NextResponse } from "next/server";

/**
 * DEVELOPMENT ONLY: A quick way to get a session cookie for manual testing.
 * Visit /api/dev-login in your browser to get authenticated as a dev user.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { createPlaywrightSession } = await import("@/tests/session");
  const { testCookies } = await createPlaywrightSession("dev-user-id");

  // Use relative URL for redirection if possible, or fallback to localhost
  const response = NextResponse.redirect(
    new URL("/dashboard", "http://localhost:3000"),
  );

  // Set the real Better Auth session cookies
  for (const cookie of testCookies) {
    response.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite as any,
      secure: cookie.secure,
      domain: cookie.domain,
    });
  }

  return response;
}
