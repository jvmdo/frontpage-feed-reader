import { NextResponse } from "next/server";
import { createPlaywrightSession } from "@/tests/session";

/**
 * DEVELOPMENT ONLY: A quick way to get a session cookie for manual testing.
 * Visit /api/dev-login in your browser to get authenticated as a dev user.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Reuse the session creation logic from tests
  const { sessionToken } = await createPlaywrightSession("dev-user-id");

  // Use relative URL for redirection if possible, or fallback to localhost
  const response = NextResponse.redirect(
    new URL("/dashboard", "http://localhost:3000"),
  );

  // Set the real Better Auth session cookie
  if (sessionToken) {
    response.cookies.set("better-auth.session_token", sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false, // development
    });
  }

  return response;
}
