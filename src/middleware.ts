import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public paths — never require auth
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/unauthorized"
  ) {
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user as {
    isAdmin?: boolean;
    isAuthorized?: boolean;
  };

  // Admin routes require admin group membership
  if (pathname.startsWith("/admin")) {
    if (!user?.isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  // If group-based access is configured, require Users or Admin group
  if (process.env.USER_GROUP_ID && user?.isAuthorized === false) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
