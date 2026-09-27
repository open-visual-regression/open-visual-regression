import { OpenAPIHandler } from "@orpc/openapi/fetch";

import { serverClient } from "@/lib/router";
import { getLoginPath } from "@/lib/utils/redirects";

const handler = new OpenAPIHandler(serverClient.baseline);

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request, { prefix: "/api/baseline" });

  if (!matched) {
    return new Response(null, { status: 404 });
  }

  if (response.status === 401) {
    const { pathname, search } = new URL(request.url);

    return new Response(null, {
      status: 302,
      headers: { location: getLoginPath(`${pathname}${search}`) },
    });
  }

  return response;
};

export const GET = serve;
