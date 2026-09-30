import { Redis } from "ioredis";

import { QueueUnavailableError, waitForConnection } from "../index";
import { describe, expect, test } from "./fixtures";

describe("waitForConnection", () => {
  test("resolves once a lazy connection is ready", async () => {
    const connection = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });

    try {
      await waitForConnection(connection, 5_000);
      expect(connection.status).toBe("ready");
    } finally {
      await connection.quit();
    }
  });

  test("rejects with QueueUnavailableError when Redis cannot be reached", async () => {
    const connection = new Redis({
      host: "127.0.0.1",
      port: 1,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
    connection.on("error", () => undefined);

    try {
      const started = Date.now();
      await expect(waitForConnection(connection, 300)).rejects.toBeInstanceOf(
        QueueUnavailableError,
      );
      expect(Date.now() - started).toBeLessThan(2_000);
    } finally {
      connection.disconnect();
    }
  });

  test("fails a queued command once the command timeout passes", async () => {
    const connection = new Redis({
      host: "127.0.0.1",
      port: 1,
      maxRetriesPerRequest: null,
      commandTimeout: 300,
    });
    connection.on("error", () => undefined);

    try {
      await expect(connection.publish("channel", "message")).rejects.toThrow("Command timed out");
    } finally {
      connection.disconnect();
    }
  });
});
