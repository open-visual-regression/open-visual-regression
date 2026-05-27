import { implement } from "@orpc/server";
import { contract } from "../contracts";
import { headers } from "next/headers";

export const os = implement(contract).use(async ({ next }) =>
  next({ context: { headers: await headers() } }),
);
