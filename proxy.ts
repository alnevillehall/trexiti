import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
} from "next/server";

import { isWorkspaceDemoMode } from "@/lib/auth/config";

const adminPrefix = "/admin";
const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const adminAuthProxy: NextMiddleware | null = clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      const { pathname } = request.nextUrl;

      if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
        await auth.protect();
      }
    })
  : null;

const protectedPrefixes = [
  "/dashboard",
  "/customers",
  "/assets",
  "/jobs",
  "/schedule",
  "/quotes",
  "/invoices",
  "/inventory",
  "/technicians",
  "/reports",
  "/settings",
  "/industry-templates",
];

function secureAdminResponse(response: Response) {
  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
    if (!adminAuthProxy) {
      return secureAdminResponse(
        new NextResponse("Not Found", { status: 404 }),
      );
    }

    const response =
      (await adminAuthProxy(request, event)) ?? NextResponse.next();
    return secureAdminResponse(response);
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (isWorkspaceDemoMode()) {
    const response = NextResponse.next();
    response.headers.set("x-trexiti-tenant", "island-cooling");
    return response;
  }

  return secureAdminResponse(new NextResponse("Not Found", { status: 404 }));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/assets/:path*",
    "/jobs/:path*",
    "/schedule/:path*",
    "/quotes/:path*",
    "/invoices/:path*",
    "/inventory/:path*",
    "/technicians/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/industry-templates/:path*",
    "/admin/:path*",
  ],
};
