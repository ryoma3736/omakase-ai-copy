/**
 * Next.js Middleware for Authentication, Rate Limiting and API Protection
 *
 * Applies to:
 * - Protected routes (dashboard, settings)
 * - API routes (rate limiting, CORS, security)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiLimiter, getClientIdentifier } from "./lib/rate-limit";
import { auth } from "./lib/auth";

/**
 * Main middleware function
 * Runs before routes are executed
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Authentication check for protected routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/agents") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/analytics")
  ) {
    const session = await auth();

    if (!session) {
      // Redirect to login for protected pages
      if (!pathname.startsWith("/api/")) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Return 401 for protected API routes
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // 2. Rate limiting for API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip rate limiting for health check endpoints
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // Apply rate limiting
  const identifier = getClientIdentifier(request);

  try {
    await apiLimiter.check(identifier);
  } catch (error) {
    // Rate limit exceeded
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Get rate limit status
  const status = apiLimiter.getStatus(identifier);

  // Create response with rate limit headers
  const response = NextResponse.next();

  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", String(status.limit));
  response.headers.set("X-RateLimit-Remaining", String(status.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.floor(status.reset / 1000))
  );

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Add CORS headers for widget API
  if (request.nextUrl.pathname.startsWith("/api/chat")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
