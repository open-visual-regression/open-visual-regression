import { describe, expect, it, vi } from "vitest";

import type { BuildStatusEvent } from "@ovr/queue/events";

import { BuildStatusHub } from "../buildStatusHub";

const makeEvent = (
  buildId: string,
  overrides: Partial<BuildStatusEvent> = {},
): BuildStatusEvent => ({
  buildId,
  processingStatus: "processing",
  reviewStatus: "not_required",
  errorMessage: null,
  ...overrides,
});

const createHub = () => {
  const close = vi.fn().mockResolvedValue(undefined);
  const createSubscriber = vi.fn((_onEvent: (event: BuildStatusEvent) => void) => ({ close }));
  const hub = new BuildStatusHub(createSubscriber);

  const emit = (event: BuildStatusEvent) => createSubscriber.mock.calls[0]?.[0](event);

  return { hub, emit, createSubscriber, close };
};

const settled = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("BuildStatusHub", () => {
  it("delivers events for the subscribed build", async () => {
    const { hub, emit } = createHub();
    const iterator = hub.subscribe("build-1")[Symbol.asyncIterator]();

    const next = iterator.next();
    emit(makeEvent("build-1", { processingStatus: "success", reviewStatus: "approved" }));

    const { value, done } = await next;
    expect(done).toBe(false);
    expect(value).toEqual(
      makeEvent("build-1", { processingStatus: "success", reviewStatus: "approved" }),
    );
  });

  it("does not deliver events for other builds", async () => {
    const { hub, emit } = createHub();
    const iterator = hub.subscribe("build-1")[Symbol.asyncIterator]();

    const next = iterator.next();
    emit(makeEvent("build-2"));

    const outcome = await Promise.race([
      next.then(() => "resolved"),
      settled().then(() => "pending"),
    ]);
    expect(outcome).toBe("pending");

    emit(makeEvent("build-1"));
    expect((await next).value).toEqual(makeEvent("build-1"));
  });

  it("fans out a single subscriber connection to every listener on a build", async () => {
    const { hub, emit, createSubscriber } = createHub();
    const first = hub.subscribe("build-1")[Symbol.asyncIterator]();
    const second = hub.subscribe("build-1")[Symbol.asyncIterator]();

    const firstNext = first.next();
    const secondNext = second.next();
    emit(makeEvent("build-1", { processingStatus: "success" }));

    expect((await firstNext).value).toEqual(makeEvent("build-1", { processingStatus: "success" }));
    expect((await secondNext).value).toEqual(makeEvent("build-1", { processingStatus: "success" }));
    expect(createSubscriber).toHaveBeenCalledTimes(1);
  });

  it("buffers events that arrive before iteration starts", async () => {
    const { hub, emit } = createHub();
    const iterable = hub.subscribe("build-1");

    emit(makeEvent("build-1", { processingStatus: "success" }));

    const iterator = iterable[Symbol.asyncIterator]();
    expect((await iterator.next()).value).toEqual(
      makeEvent("build-1", { processingStatus: "success" }),
    );
  });

  it("ends iteration and stops delivering once the signal aborts", async () => {
    const { hub, emit } = createHub();
    const controller = new AbortController();
    const iterator = hub.subscribe("build-1", controller.signal)[Symbol.asyncIterator]();

    const next = iterator.next();
    controller.abort();
    expect((await next).done).toBe(true);

    // Listener was cleaned up: a later event has nowhere to go and is a no-op.
    expect(() => emit(makeEvent("build-1"))).not.toThrow();
  });
});
