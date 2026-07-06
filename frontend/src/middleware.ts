import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/tasks", "/annotate"];

function isAccessTokenValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp !== "number") return true;
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isProtected) return NextResponse.next();

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken || !isAccessTokenValid(accessToken)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (accessToken && !isAccessTokenValid(accessToken)) {
      response.cookies.delete("access_token");
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tasks/:path*", "/annotate/:path*"],
};
