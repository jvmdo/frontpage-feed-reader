import { type NextRequest, NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await getSessionFromHeaders(request.headers);

  const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // If user is logged in and tries to access sign-in/sign-up
  if (session && isAuthRoute) {
    // ALLOW anonymous users to stay on auth routes so they can register themselves
    if (session.user.isAnonymous) {
      return NextResponse.next();
    }
    // Regular users are redirected to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not logged in and tries to access dashboard, redirect to sign-in
  if (!session && isDashboardRoute) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
