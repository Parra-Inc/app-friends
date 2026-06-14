import { NextResponse, type NextRequest } from "next/server";

/**
 * Forward the current pathname as a request header so server layouts (which
 * don't have `usePathname`) can render active-nav state. CORS for the SDK is
 * handled in the route handlers themselves.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)).*)",
  ],
};
