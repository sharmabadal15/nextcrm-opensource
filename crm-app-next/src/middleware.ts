export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Match all dashboard routes
    "/dashboard/:path*",
    "/contacts/:path*",
    "/companies/:path*",
    "/deals/:path*",
    "/activities/:path*",
    "/calendar/:path*",
    "/reports/:path*",
    "/settings/:path*",
    // Match auth routes (for redirect if already logged in)
    "/login",
    "/register",
  ],
};
