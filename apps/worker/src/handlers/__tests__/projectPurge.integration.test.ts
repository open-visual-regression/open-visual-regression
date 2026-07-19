import { v7 as uuidv7 } from "uuid";

import { storage } from "@ovr/storage";

import { describe, expect, test } from "../../__tests__/fixtures";
import { run } from "../projectPurge";

describe("projectPurge", () => {
  test("should delete every object stored under the project prefix", async () => {
    const projectId = uuidv7();

    await storage.uploadFile(
      `${projectId}/builds/b1/artifact.tar.gz`,
      Buffer.from("a"),
      "application/gzip",
    );
    await storage.uploadFile(
      `${projectId}/builds/b1/snapshots/s1.png`,
      Buffer.from("b"),
      "image/png",
    );

    await run({ data: { projectId } });

    expect(await storage.objectExists(`${projectId}/builds/b1/artifact.tar.gz`)).toBe(false);
    expect(await storage.objectExists(`${projectId}/builds/b1/snapshots/s1.png`)).toBe(false);
  });

  test("should not touch objects belonging to other projects", async () => {
    const projectId = uuidv7();
    const otherProjectId = uuidv7();

    await storage.uploadFile(
      `${projectId}/builds/b1/snapshots/s1.png`,
      Buffer.from("a"),
      "image/png",
    );
    await storage.uploadFile(
      `${otherProjectId}/builds/b1/snapshots/s1.png`,
      Buffer.from("b"),
      "image/png",
    );

    await run({ data: { projectId } });

    expect(await storage.objectExists(`${projectId}/builds/b1/snapshots/s1.png`)).toBe(false);
    expect(await storage.objectExists(`${otherProjectId}/builds/b1/snapshots/s1.png`)).toBe(true);
  });
});
