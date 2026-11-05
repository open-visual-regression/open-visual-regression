import { S3ServiceException } from "@aws-sdk/client-s3";

import { storage } from "../index";
import { boundErrorCode, classifyStorageError } from "../metrics";
import { describe, expect, test } from "./fixtures";

const s3Error = (name: string, httpStatusCode: number) =>
  new S3ServiceException({ name, $fault: "server", $metadata: { httpStatusCode } });

describe("storage metrics", () => {
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
