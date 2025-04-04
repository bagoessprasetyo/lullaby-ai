import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const isAuthenticated = !!req.nextauth?.token;
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');
    
    // Log auth debugging info
    console.log(`[MIDDLEWARE] Request to ${req.nextUrl.pathname}`, {
      isAuthenticated,
      isProtectedRoute,
      token: req.nextauth?.token ? "Token exists" : "No token"
    });
    
    // If authenticated and accessing protected route, allow access
    if (isAuthenticated && isProtectedRoute) {
      return NextResponse.next();
    }
    
    // If not authenticated and accessing protected route, redirect to home
    if (!isAuthenticated && isProtectedRoute) {
      const redirectUrl = new URL('/', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // For all other cases, continue normally
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // This function only determines if withAuth should call our middleware function
        // We always want it to call our middleware so we can handle the logic ourselves
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth|$).*)',
    '/dashboard/:path*'  // Explicitly protect dashboard routes
  ],
};
