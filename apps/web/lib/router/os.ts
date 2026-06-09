import { implement } from "@orpc/server";
import { headers } from "next/headers";
import { contract } from "@ovr/api/contracts/contract";

export const os = implement(contract).use(async ({ next }) =>
  next({ context: { headers: await headers() } }),
);

export type RequestContext = {
  headers: Headers;
};
