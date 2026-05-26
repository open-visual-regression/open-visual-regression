import { createRouterClient } from "@orpc/server";
import { router } from "@ovr/api";

export const rpc = createRouterClient({ router });
