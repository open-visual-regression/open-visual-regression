import { NextResponse, type NextRequest } from "next/server";

import { REQUEST_PATH_HEADER } from "@/lib/utils/redirects";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(REQUEST_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
