// middleware.ts
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// Simplified middleware that just protects dashboard routes
export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Only apply middleware to dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};