import { implement, onError, ORPCError } from "@orpc/server";
import { headers } from "next/headers";
import { contract } from "@ovr/api/contracts/contract";
import { createLogger } from "@ovr/logger";

const logger = createLogger("rpc");

export const os = implement(contract)
  .use(
    onError((error, { path }) => {
      if (!(error instanceof ORPCError)) {
        logger.error({ err: error, path: path.join(".") }, "unexpected error");
      }
    }),
  )
  .use(async ({ next }) => next({ context: { headers: await headers() } }));

export type RequestContext = {
  headers: Headers;
};
