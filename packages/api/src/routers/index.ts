import * as setup from "./setup";

export { safe } from "@orpc/server";

export const router = {
  setup,
} as const;
