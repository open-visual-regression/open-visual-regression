import "server-only";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import { serverClient } from "@/lib/router";

// In-process client for server rendering: no HTTP round-trip, and it throws on
// error (the tuple-returning serverClient is not what the query utils expect).
const client = createRouterClient(serverClient);

export const orpcServer = createTanstackQueryUtils(client);
