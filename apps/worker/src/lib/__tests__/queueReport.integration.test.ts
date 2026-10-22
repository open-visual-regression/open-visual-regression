import { dbClient } from "@ovr/db/client";
import { QueueName } from "@ovr/queue";

import { describe, expect, test } from "../../__tests__/fixtures";
import { reportQueueDepth } from "../queueReport";

describe("reportQueueDepth", () => {
  test("logs queue and build counts from only one of several workers", async ({
    build,
    connection,
    createMockLogger,
  }) => {
    await dbClient.builds.updateProcessingStatus(build.id, "processing");
    const loggers = [createMockLogger(), createMockLogger(), createMockLogger()];

    await Promise.all(loggers.map((logger) => reportQueueDepth(logger, connection, 1000)));

    expect(loggers.flatMap((logger) => logger.info.mock.calls)).toEqual([
      [
        expect.objectContaining({
          builds: { queued: 0, processing: 1 },
          queues: expect.objectContaining({
            [QueueName.SNAPSHOT_CAPTURE]: expect.objectContaining({ waiting: expect.any(Number) }),
          }),
        }),
        "queue depth",
      ],
    ]);
  });
});
