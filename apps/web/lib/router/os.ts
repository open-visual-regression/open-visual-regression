import { ORPCError, implement } from "@orpc/server";
import { headers } from "next/headers";
import { contract } from "@ovr/api/contract";
import { auth } from "../auth/auth";

export const os = implement(contract).use(async ({ next }) =>
  next({ context: { headers: await headers() } }),
);

export const adminMiddleware = os.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  if (session.user.role !== "admin") throw new ORPCError("FORBIDDEN");
  return next({ context: { session } });
});
