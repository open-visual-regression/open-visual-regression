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

    // Re-publish until the subscription is active: Redis pub/sub drops messages
    // that have no subscriber yet.
    const publisher = setInterval(() => void publishBuildStatusEvent(event, connection), 50);

    try {
      await expect(received).resolves.toEqual(event);
    } finally {
      clearInterval(publisher);
      await subscriber?.close();
    }
  });
});
