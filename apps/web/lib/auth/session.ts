import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth";

/**
 * Resolves the current session, deduplicated for the lifetime of the request.
 *
 * Every oRPC procedure authenticates through `authenticatedMiddleware`, and a
 * single page renders several of them alongside its own session read, so an
 * uncached lookup costs two queries (session + user) per call — 11-18 per
 * navigation. `cache` collapses those into one, since React scopes the memo to
 * the request.
 */
export const getCachedSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export const requireSession = async () => {
  const session = await getCachedSession();

  if (!session) {
    redirect("/login");
  }

  return session;
};
