import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { getLoginPath, REQUEST_PATH_HEADER } from "@/lib/utils/redirects";

import { auth } from "./auth";

export const getCachedSession = cache(async () => {
  await connection();

  return auth.api.getSession({ headers: await headers() });
});

export const requireSession = async () => {
  const session = await getCachedSession();

  if (!session) {
    const requestPath = (await headers()).get(REQUEST_PATH_HEADER);

    redirect(requestPath ? getLoginPath(requestPath) : "/login");
  }

  return session;
};
