import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Routes that logged-in users shouldn't visit
const UNAUTHENTICATED_ONLY_ROUTES = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
]);

// Public routes accessible without login
const PUBLIC_ROUTES = new Set([
  ...UNAUTHENTICATED_ONLY_ROUTES,
  "/reset-password",
]);

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Cookie-only check — fast, optimistic. Does NOT validate the session.
  // Real authorization must still happen in each page/route.
  const sessionCookie = getSessionCookie(request);

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  // Redirect authenticated users away from unauthenticated-only routes and invalid reset-password URLs
  if (sessionCookie) {
    const isUnauthenticatedOnly = UNAUTHENTICATED_ONLY_ROUTES.has(pathname);
    const isResetWithoutToken =
      pathname === "/reset-password" && !searchParams.has("token");

    if (isUnauthenticatedOnly || isResetWithoutToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Deny-by-default: Unauthenticated users visiting non-public routes get sent to /sign-in
  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static asset files & metadata (e.g. .jpg, .png, .svg, .ico, .webp, .xml, .webmanifest)
     * - sitemap.xml, robots.txt, feed.xml, manifest.webmanifest
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|feed.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|xml|webmanifest)$).*)",
  ],
};
