import { RPCHandler } from "@orpc/server/fetch";
import { serverClient } from "@/lib/router";

const handler = new RPCHandler(serverClient);

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request, { prefix: "/api/rpc", context: {} });

  if (matched) {
    return response;
  }

  return new Response(null, { status: 404 });
};

export const GET = serve;
export const POST = serve;
