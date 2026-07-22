import { OpenAPIHandler } from "@orpc/openapi/fetch";

import { serverClient } from "@/lib/router";

export const runtime = "nodejs";

const handler = new OpenAPIHandler(serverClient.storybook);

const serve = async (request: Request) => {
  const url = new URL(request.url);
  const normalized = url.search
    ? new Request(url.origin + url.pathname, { method: request.method, headers: request.headers })
    : request;

  const { matched, response } = await handler.handle(normalized, { prefix: "/api/storybook" });

  if (matched) {
    return response;
  }

  return new Response(null, { status: 404 });
};

export const GET = serve;
