import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { type GetBuildStatusOutput } from "@ovr/api/contracts/builds";

import { client } from "@/lib/orpc/client";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { BuildStatusStream } from "../BuildStatusStream";

vi.mock("next/navigation");
vi.mock("@/lib/orpc/client", () => ({
  client: { builds: { watchStatus: vi.fn() } },
}));

const mockWatchStatus = vi.mocked(client.builds.watchStatus);
const mockRefresh = vi.mocked(useRouter)().refresh;

const createStream = () => {
  const buffer: GetBuildStatusOutput[] = [];
  const resolvers: ((result: IteratorResult<GetBuildStatusOutput>) => void)[] = [];

  const iterable: AsyncIterable<GetBuildStatusOutput> = {
    [Symbol.asyncIterator]: () => ({
      next: () => {
        const queued = buffer.shift();
        if (queued) {
          return Promise.resolve({ value: queued, done: false });
        }
        return new Promise((resolve) => resolvers.push(resolve));
      },
    }),
  };

  const push = (event: GetBuildStatusOutput) => {
    const resolve = resolvers.shift();
    if (resolve) {
      resolve({ value: event, done: false });
    } else {
      buffer.push(event);
    }
  };

  return { iterable, push };
};

describe("BuildStatusStream", () => {
  it("renders the initial status", () => {
    mockWatchStatus.mockResolvedValue(createStream().iterable as never);
    render(<BuildStatusStream buildId="b1" initialStatus="processing" />);

    expect(screen.getByText("processing")).toBeVisible();
  });

  it("updates the badge from each streamed status", async () => {
    const stream = createStream();
    mockWatchStatus.mockResolvedValue(stream.iterable as never);
    render(<BuildStatusStream buildId="b1" initialStatus="processing" />);

    stream.push({ status: "approved" });

    expect(await screen.findByText("approved")).toBeVisible();
  });

  it("refreshes once for a burst of transitions", async () => {
    const stream = createStream();
    mockWatchStatus.mockResolvedValue(stream.iterable as never);
    render(<BuildStatusStream buildId="b1" initialStatus="queued" />);

    stream.push({ status: "processing" });
    stream.push({ status: "needs_review" });
    stream.push({ status: "approved" });

    await screen.findByText("approved");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
