import { OpenAPIHandler } from "@orpc/openapi/fetch";

import { serverClient } from "@/lib/router";

export const runtime = "nodejs";

const handler = new OpenAPIHandler(serverClient.storybook);

const serve = async (request: Request) => {
  // Storybook's manager deep-links a story with `index.html?path=/story/<id>`, a
  // client-side-only convention. That `path` query collides with this route's own
  // `path` input param and would otherwise resolve the file as `/story/<id>`. The
  // served file only ever depends on the URL path, so drop the query string before
  // matching — the browser keeps it for Storybook's client-side router.
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
