import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth";

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
