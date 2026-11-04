import "server-only";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import { serverClient } from "@/lib/router";

export const orpcServerClient = createRouterClient(serverClient);

export const orpcServer = createTanstackQueryUtils(orpcServerClient);
