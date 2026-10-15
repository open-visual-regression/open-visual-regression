import { type ORPCErrorJSON } from "@orpc/client";
import { type InferContractRouterInputs } from "@orpc/contract";
import { delay, http, HttpResponse } from "msw";
import { vi } from "vitest";

import { type contract } from "@ovr/api/contracts/contract";

import { server } from "./server";

type Inputs = InferContractRouterInputs<typeof contract>;

type MockProcedureOptions = {
  error?: ORPCErrorJSON<string, unknown>;
  pending?: boolean;
};

const mockProcedure = <TInput>(
  path: string,
  { error, pending = false }: MockProcedureOptions = {},
) => {
  const spy = vi.fn<(input: TInput) => void>();

  server.use(
    http.post(`*/api/rpc/${path}`, async ({ request }) => {
      const { json } = (await request.json()) as { json: TInput };
      spy(json);

      if (pending) {
        await delay("infinite");
      }

      return error
        ? HttpResponse.json({ json: error }, { status: error.status })
        : HttpResponse.json({});
    }),
  );

  return spy;
};

export const mockHandlers = {
  mockCastVote: (options?: MockProcedureOptions) =>
    mockProcedure<Inputs["diffs"]["castVote"]>("diffs/castVote", options),
};
