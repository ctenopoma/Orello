import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "next-runtime-env";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    // Always redirect to boards for desktop app (no login needed)
    const boardsUrl = new URL("/boards", request.url);
    return NextResponse.redirect(boardsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
