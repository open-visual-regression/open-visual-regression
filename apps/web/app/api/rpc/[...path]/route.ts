import { ORPCHandler } from "@orpc/server/fetch";
import { serve } from "@orpc/server/next";
import { router } from "@ovr/api";

export const { GET, POST } = serve(new ORPCHandler(router));
