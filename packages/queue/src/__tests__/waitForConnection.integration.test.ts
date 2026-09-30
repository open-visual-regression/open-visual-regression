import { QueueUnavailableError, waitForConnection } from "../index";
import { describe, expect, test } from "./fixtures";

const UNREACHABLE = { host: "127.0.0.1", port: 1 };

describe("waitForConnection", () => {
  test("resolves once a lazy connection is ready", async ({ openConnection }) => {
    const connection = openConnection({ lazyConnect: true });

    await waitForConnection(connection, 5_000);

    expect(connection.status).toBe("ready");
  });

  test("rejects with QueueUnavailableError when Redis cannot be reached", async ({
    openConnection,
  }) => {
    const connection = openConnection({ ...UNREACHABLE, lazyConnect: true });
    const started = Date.now();

    await expect(waitForConnection(connection, 300)).rejects.toBeInstanceOf(QueueUnavailableError);
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  test("fails a queued command once the command timeout passes", async ({ openConnection }) => {
    const connection = openConnection({ ...UNREACHABLE, commandTimeout: 300 });

    await expect(connection.publish("channel", "message")).rejects.toThrow("Command timed out");
  });
});
