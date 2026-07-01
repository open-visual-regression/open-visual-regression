import "server-only";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import { serverClient } from "@/lib/router";

const client = createRouterClient(serverClient);

export const orpcServer = createTanstackQueryUtils(client);
