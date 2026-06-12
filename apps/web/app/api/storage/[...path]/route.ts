import { OpenAPIHandler } from "@orpc/openapi/fetch";

import { serverClient } from "@/lib/router";

const handler = new OpenAPIHandler(serverClient.storage);

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request, { prefix: "/api/storage" });

  if (matched) {
    return response;
  }

  return new Response(null, { status: 404 });
};

export const GET = serve;
