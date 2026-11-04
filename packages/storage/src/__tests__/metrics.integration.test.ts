import { DeleteObjectsCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { afterEach, vi } from "vitest";

import { storage } from "../index";
import { boundErrorCode, classifyStorageError } from "../metrics";
import { describe, expect, test } from "./fixtures";

const s3Error = (name: string, httpStatusCode: number) =>
  new S3ServiceException({ name, $fault: "server", $metadata: { httpStatusCode } });

describe("storage metrics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("counts and times a successful request by operation", async ({ key, metrics }) => {
    await storage.uploadFile(key, Buffer.from("png"), "image/png");

    const body = await metrics.scrape();
    expect(body).toContain('ovr_storage_requests_total{operation="PutObject",outcome="success"} 1');
    expect(body).toMatch(/ovr_storage_request_duration_seconds_count\{operation="PutObject"\} 1/);
  });

  test("counts a missing object as a client error, not a failure", async ({ key, metrics }) => {
    expect(await storage.objectExists(key)).toBe(false);

    expect(await metrics.scrape()).toContain(
      'ovr_storage_requests_total{operation="HeadObject",outcome="client_error",error_code="NotFound"} 1',
    );
  });

  test("does not count presigning a URL as a request", async ({ key, metrics }) => {
    await storage.getPresignedUrl(key, 60);
    await storage.getPresignedUploadUrl(key, 60);

    expect(await metrics.scrape()).not.toContain("ovr_storage_requests_total{");
  });

  test("counts deleted objects by reason", async ({ prefix, metrics }) => {
    await storage.uploadFile(`${prefix}a.png`, Buffer.from("a"), "image/png");
    await storage.uploadFile(`${prefix}b.png`, Buffer.from("b"), "image/png");

    await storage.deletePrefix(prefix, { reason: "build_purge" });

    expect(await metrics.scrape()).toContain(
      'ovr_storage_objects_deleted_total{reason="build_purge"} 2',
    );
  });

  test("counts objects the store refused to delete by error code", async ({ prefix, metrics }) => {
    const failingKey = `${prefix}b.png`;
    await storage.uploadFile(`${prefix}a.png`, Buffer.from("a"), "image/png");
    await storage.uploadFile(failingKey, Buffer.from("b"), "image/png");

    const send = S3Client.prototype.send as (this: S3Client, command: unknown) => Promise<unknown>;
    vi.spyOn(S3Client.prototype, "send").mockImplementation(async function (
      this: S3Client,
      command: Parameters<S3Client["send"]>[0],
    ) {
      if (command instanceof DeleteObjectsCommand) {
        const { Bucket, Delete } = command.input;
        await send.call(
          this,
          new DeleteObjectsCommand({
            Bucket,
            Delete: { Objects: Delete?.Objects?.filter(({ Key }) => Key !== failingKey) },
          }),
        );
        return { Errors: [{ Key: failingKey, Code: "AccessDenied", Message: "Access Denied" }] };
      }
      return send.call(this, command);
    } as S3Client["send"]);

    await expect(storage.deletePrefix(prefix, { reason: "project_purge" })).rejects.toThrow();

    const body = await metrics.scrape();
    expect(body).toContain('ovr_storage_objects_deleted_total{reason="project_purge"} 1');
    expect(body).toContain(
      'ovr_storage_objects_delete_failed_total{reason="project_purge",error_code="AccessDenied"} 1',
    );
  });
});

describe("classifyStorageError", () => {
  test.each([
    ["SlowDown", 503, "throttled"],
    ["TooManyRequests", 429, "throttled"],
    ["InternalError", 500, "server_error"],
    ["AccessDenied", 403, "client_error"],
    ["NoSuchKey", 404, "client_error"],
  ] as const)("classifies %s (%i) as %s", (name, status, outcome) => {
    expect(classifyStorageError(s3Error(name, status))).toEqual({ outcome, errorCode: name });
  });

  test("classifies a failure with no HTTP response as a network error", () => {
    const refused = Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });

    expect(classifyStorageError(refused)).toEqual({
      outcome: "network_error",
      errorCode: "ECONNREFUSED",
    });
  });
});

describe("boundErrorCode", () => {
  test("reports at most 20 distinct codes and folds the rest into Other", () => {
    const reported = Array.from({ length: 30 }, (_, index) => boundErrorCode(`Code${index}`));

    expect(new Set(reported.filter((code) => code !== "Other")).size).toBeLessThanOrEqual(20);
    expect(reported.at(-1)).toBe("Other");
    expect(boundErrorCode(reported[0]!)).toBe(reported[0]);
  });
});
