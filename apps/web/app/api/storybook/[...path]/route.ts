import { OpenAPIHandler } from "@orpc/openapi/fetch";

import { serverClient } from "@/lib/router";

export const runtime = "nodejs";

const handler = new OpenAPIHandler(serverClient.storybook);

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request, { prefix: "/api/storybook" });

  if (matched) {
    return response;
  }

  return new Response(null, { status: 404 });
};

export const GET = serve;
