import { NextResponse } from "next/server";

const protectedPrefixes = ["/admin", "/crm"];

function isProtectedPath(pathname) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function unauthorized(message = "Trexiti admin authentication required.") {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Trexiti Admin", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function parseBasicAuth(header) {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const local = isLocalHost(hostname);
  const adminUser = process.env.TREXITI_ADMIN_USER || (local ? "admin" : "");
  const adminPassword = process.env.TREXITI_ADMIN_PASSWORD || (local ? "trexiti-local-admin" : "");

  if (!adminUser || !adminPassword) {
    return unauthorized("Trexiti admin credentials are not configured.");
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));

  if (!credentials || credentials.username !== adminUser || credentials.password !== adminPassword) {
    return unauthorized();
  }

  if (pathname === "/crm" || pathname.startsWith("/crm/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/crm/, "/admin") || "/admin";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/crm/:path*"],
};
