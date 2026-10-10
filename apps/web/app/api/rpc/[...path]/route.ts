import { RPCHandler } from "@orpc/server/fetch";

import { SERVER_VERSION_HEADER } from "@ovr/api/contracts/contract";

import { serverClient } from "@/lib/router";
import { APP_VERSION } from "@/lib/utils/version";

const handler = new RPCHandler(serverClient);

const withServerVersion = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set(SERVER_VERSION_HEADER, APP_VERSION);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request, { prefix: "/api/rpc", context: {} });

  if (matched) {
    return withServerVersion(response);
  }

  return withServerVersion(new Response(null, { status: 404 }));
};

export const GET = serve;
export const POST = serve;
