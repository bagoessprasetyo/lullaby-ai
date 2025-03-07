// Updated middleware.ts
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Debug logging
    console.log("[MIDDLEWARE] Request path:", req.nextUrl.pathname);
    console.log("[MIDDLEWARE] Auth token present:", !!req.nextauth?.token);
    
    // If token exists but still redirecting, there's a session issue
    if (req.nextauth?.token) {
      console.log("[MIDDLEWARE] Token details:", req.nextauth.token);
      return NextResponse.next();
    }
    
    console.log("[MIDDLEWARE] No token, redirecting to signin");
    return NextResponse.redirect(new URL("/", req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log("[MIDDLEWARE] Authorization check:", !!token);
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};