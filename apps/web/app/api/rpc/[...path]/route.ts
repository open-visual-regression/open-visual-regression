import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@ovr/api/router";

const handler = new RPCHandler(router);

const serve = async (request: Request) => {
  const { matched, response } = await handler.handle(request);

  if (matched) {
    return response;
  }

  return new Response(null, { status: 404 });
};

export const GET = serve;
export const POST = serve;
