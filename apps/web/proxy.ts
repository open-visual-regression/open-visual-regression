import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/rpc") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const setupCookie = request.cookies.get("ovr_setup_complete");

  if (!setupCookie && pathname !== "/setup") {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (pathname !== "/login" && pathname !== "/setup" && !pathname.startsWith("/invite/")) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
