import { describe, expect, test } from "vitest";

import { createUploadQueue } from "../lib/uploadQueue";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
};

describe("createUploadQueue", () => {
  test("starts the next task while an earlier one is still running", async () => {
    const queue = createUploadQueue(2);
    const first = deferred();
    const started: string[] = [];

    await queue.add(async () => {
      started.push("first");
      await first.promise;
    });
    await queue.add(async () => {
      started.push("second");
    });

    expect(started).toEqual(["first", "second"]);

    first.resolve();
    await queue.drain();
  });

  test("holds a task back until a slot frees up", async () => {
    const queue = createUploadQueue(2);
    const running = deferred();
    const started: string[] = [];

    await queue.add(async () => {
      started.push("first");
      await running.promise;
    });
    await queue.add(async () => {
      started.push("second");
      await running.promise;
    });

    const third = queue.add(async () => {
      started.push("third");
    });

    expect(started).toEqual(["first", "second"]);

    running.resolve();
    await third;
    await queue.drain();

    expect(started).toEqual(["first", "second", "third"]);
  });

  test("reports a failed task when the queue is drained", async () => {
    const queue = createUploadQueue(2);

    await queue.add(() => Promise.reject(new Error("storage is unreachable")));

    await expect(queue.drain()).rejects.toThrow("storage is unreachable");
  });

  test("does not reject the caller that queued a failing task", async () => {
    const queue = createUploadQueue(2);

    await expect(
      queue.add(() => Promise.reject(new Error("storage is unreachable"))),
    ).resolves.toBeUndefined();

    await expect(queue.drain()).rejects.toThrow("storage is unreachable");
  });
});
