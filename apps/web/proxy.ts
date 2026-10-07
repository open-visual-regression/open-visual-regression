import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { getLoginPath, isPublicPath, REQUEST_PATH_HEADER } from "@/lib/utils/redirects";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestPath = `${pathname}${search}`;

  if (!isPublicPath(pathname) && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL(getLoginPath(requestPath), request.url));
  }

  const headers = new Headers(request.headers);
  headers.set(REQUEST_PATH_HEADER, requestPath);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
