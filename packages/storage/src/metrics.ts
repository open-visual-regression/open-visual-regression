import type { S3Client } from "@aws-sdk/client-s3";
import type { FinalizeRequestMiddleware, MetadataBearer } from "@smithy/types";

import { createCounter, createHistogram } from "@ovr/metrics";

/**
 * How a request to the object store ended. `client_error` covers expected misses too (a 404 from
 * `objectExists`), so alert on `throttled`, `server_error` and `network_error` instead.
 */
export type StorageRequestOutcome =
  | "success"
  | "client_error"
  | "throttled"
  | "server_error"
  | "network_error";

/** Why objects are being deleted, so a dashboard can tell build purges from project deletes. */
export type StorageDeleteReason = "build_purge" | "project_purge" | "other";

// Each bucket is one more series per operation, so keep these coarse.
const REQUEST_DURATION_BUCKETS_SECONDS = [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

// error_code comes from whatever the SDK or the network raises, so cap how many distinct values
// one process reports. Past the cap, new codes are reported as "Other".
const MAX_ERROR_CODES = 20;
const seenErrorCodes = new Set<string>();

export const boundErrorCode = (code: string): string => {
  if (seenErrorCodes.has(code)) {
    return code;
  }
  if (seenErrorCodes.size >= MAX_ERROR_CODES) {
    return "Other";
  }
  seenErrorCodes.add(code);
  return code;
};

const storageRequests = createCounter<{
  operation: string;
  outcome: StorageRequestOutcome;
  error_code?: string;
}>("ovr.storage.requests", {
  description:
    "Requests to the object store, by operation and outcome. Each SDK retry counts as its own request.",
});

const storageRequestDuration = createHistogram<{ operation: string }>(
  "ovr.storage.request.duration.seconds",
  {
    description: "How long each request to the object store took, including failed attempts.",
    unit: "s",
    buckets: REQUEST_DURATION_BUCKETS_SECONDS,
  },
);

export const objectsDeleted = createCounter<{ reason: StorageDeleteReason }>(
  "ovr.storage.objects.deleted",
  { description: "Objects deleted from the object store, by why they were deleted." },
);

const objectDeleteFailures = createCounter<{
  reason: StorageDeleteReason;
  error_code: string;
}>("ovr.storage.objects.delete.failed", {
  description:
    "Objects the store refused to delete in a batch delete that otherwise succeeded, by error code. They are retried on the next run.",
});

export const recordDeleteFailure = (reason: StorageDeleteReason, errorCode: string): void => {
  objectDeleteFailures.add(1, { reason, error_code: boundErrorCode(errorCode) });
};

type ErrorLike = {
  name?: string;
  code?: string;
  $metadata?: { httpStatusCode?: number };
};

const THROTTLE_CODES = new Set([
  "SlowDown",
  "Throttling",
  "ThrottlingException",
  "TooManyRequests",
]);

export const classifyStorageError = (
  error: unknown,
): { outcome: StorageRequestOutcome; errorCode: string } => {
  const { name, code, $metadata } = (error ?? {}) as ErrorLike;
  const status = $metadata?.httpStatusCode;
  const errorCode = name ?? code ?? "Unknown";

  if (status === 429 || status === 503 || THROTTLE_CODES.has(errorCode)) {
    return { outcome: "throttled", errorCode };
  }
  if (status !== undefined && status >= 400 && status < 500) {
    return { outcome: "client_error", errorCode };
  }
  if (status !== undefined && status >= 500) {
    return { outcome: "server_error", errorCode };
  }
  // No HTTP response at all: refused connections, socket timeouts, DNS failures.
  return { outcome: "network_error", errorCode: code ?? errorCode };
};

const operationName = (commandName: string | undefined): string =>
  commandName?.replace(/Command$/, "") ?? "Unknown";

/**
 * Records every attempt the client makes. It sits just inside the SDK's retry middleware, so a
 * request that succeeds on its third try shows up as two failures and one success.
 */
export const instrumentClient = (client: S3Client): void => {
  const middleware: FinalizeRequestMiddleware<object, MetadataBearer> =
    (next, context) => async (args) => {
      const operation = operationName(context.commandName);
      const startedAt = performance.now();

      try {
        const output = await next(args);
        storageRequests.add(1, { operation, outcome: "success" });
        return output;
      } catch (error) {
        const { outcome, errorCode } = classifyStorageError(error);
        storageRequests.add(1, { operation, outcome, error_code: boundErrorCode(errorCode) });
        throw error;
      } finally {
        storageRequestDuration.record((performance.now() - startedAt) / 1000, { operation });
      }
    };

  client.middlewareStack.addRelativeTo(middleware, {
    name: "ovrStorageMetrics",
    relation: "after",
    toMiddleware: "retryMiddleware",
    override: true,
  });
};
