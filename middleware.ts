// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define which routes need authentication
const protectedRoutes = ["/games", "/games/new", "/games/[id]"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication check for the home/login page
  if (pathname === "/" || pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  // Check if the path is a protected route
  if (
    protectedRoutes.some((route) => {
      if (route.includes("[id]")) {
        // Handle dynamic routes
        const baseRoute = route.split("/[")[0];
        return pathname.startsWith(baseRoute + "/");
      }
      return pathname === route || pathname.startsWith(`${route}/`);
    })
  ) {
    const token = request.cookies.get("auth_token")?.value;

    // If no token, redirect to home/login
    if (!token) {
      const url = new URL("/", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify token
      await jwtVerify(
        token,
        new TextEncoder().encode(
          process.env.JWT_SECRET || "softball-secret-key-change-in-production"
        )
      );

      return NextResponse.next();
    } catch {
      // Invalid token, redirect to home/login
      const url = new URL("/", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
