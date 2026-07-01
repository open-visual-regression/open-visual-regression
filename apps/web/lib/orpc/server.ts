import "server-only";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import { serverClient } from "@/lib/router";

/**
 * In-process oRPC client for use during server rendering. Unlike the browser
 * client it calls the router handlers directly (no HTTP round-trip), and unlike
 * `serverClient` it throws on error instead of returning a `[error, data]`
 * tuple, which is what the TanStack Query utils expect.
 *
 * The request context (headers) is resolved by the base router middleware, so
 * no context needs to be supplied here.
 */
const client = createRouterClient(serverClient);

/**
 * Server-side TanStack Query utils. Produces the same query keys as the browser
 * `orpc` utils, allowing prefetched queries to hydrate on the client.
 */
export const orpcServer = createTanstackQueryUtils(client);
