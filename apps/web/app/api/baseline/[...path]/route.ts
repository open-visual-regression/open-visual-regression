import { OpenAPIHandler } from "@orpc/openapi/fetch";

import { serverClient } from "@/lib/router";

const handler = new OpenAPIHandler(serverClient.baseline);

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request, { prefix: "/api/baseline" });

  if (!matched) {
    return new Response(null, { status: 404 });
  }

  if (response.status === 401) {
    return new Response(null, { status: 302, headers: { location: "/login" } });
  }

  return response;
};

export const GET = serve;
