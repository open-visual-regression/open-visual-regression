import {
  createBuildStatusSubscriber,
  publishBuildStatusEvent,
  type BuildStatusEvent,
  type BuildStatusSubscriber,
} from "../events";
import { describe, expect, test } from "./fixtures";

const redisUrl = (): string => `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

describe("build status events", () => {
  test("delivers a published event to a subscriber", async ({ connection }) => {
    const event: BuildStatusEvent = {
      buildId: "build-1",
      processingStatus: "success",
      reviewStatus: "approved",
      errorMessage: null,
    };

    let subscriber: BuildStatusSubscriber | undefined;
    const received = new Promise<BuildStatusEvent>((resolve) => {
      subscriber = createBuildStatusSubscriber(resolve, redisUrl());
    });

    // Redis drops messages published before the subscription is active, so keep retrying.
    const publisher = setInterval(() => void publishBuildStatusEvent(event, connection), 50);

    try {
      await expect(received).resolves.toEqual(event);
    } finally {
      clearInterval(publisher);
      await subscriber?.close();
    }
  });
});
