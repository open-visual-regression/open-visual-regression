import { vi } from "vitest";

import {
  createBuildStatusSubscriber,
  publishBuildStatusEvent,
  type BuildStatusEvent,
} from "../events";
import { describe, expect, test } from "./fixtures";

const redisUrl = (): string => `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

describe("createBuildStatusSubscriber", () => {
  test("should deliver a published event to the subscriber", async ({ connection }) => {
    const event: BuildStatusEvent = {
      buildId: "build-1",
      processingStatus: "success",
      reviewStatus: "approved",
      errorMessage: null,
    };
    const onEvent = vi.fn<(event: BuildStatusEvent) => void>();
    const subscriber = createBuildStatusSubscriber(onEvent, redisUrl());

    await subscriber.ready;
    await publishBuildStatusEvent(event, connection);

    await vi.waitFor(() => expect(onEvent).toHaveBeenCalledWith(event));

    await subscriber.close();
  });
});
