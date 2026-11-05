import { Readable } from "node:stream";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";

import {
  instrumentClient,
  objectsDeleted,
  recordDeleteFailure,
  type StorageDeleteReason,
} from "./metrics";

export type { StorageDeleteReason } from "./metrics";

const KEEP_ALIVE_MAX_SOCKETS = 50;

const staticCredentials =
  process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY
    ? {
        accessKeyId: process.env.STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.STORAGE_SECRET_KEY,
      }
    : undefined;

const createClient = (endpoint: string | undefined): S3Client =>
  new S3Client({
    endpoint: endpoint || undefined,
    region: process.env.STORAGE_REGION ?? "us-east-1",
    ...(staticCredentials ? { credentials: staticCredentials } : {}),
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== "false",
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 5_000,
      socketTimeout: 30_000,
      httpAgent: { keepAlive: true, maxSockets: KEEP_ALIVE_MAX_SOCKETS },
      httpsAgent: { keepAlive: true, maxSockets: KEEP_ALIVE_MAX_SOCKETS },
    }),
  });

const client = createClient(process.env.STORAGE_ENDPOINT);
instrumentClient(client);

// Presigning runs the middleware stack, so it must not share the instrumented client.
const presignClient = createClient(
  process.env.STORAGE_PUBLIC_ENDPOINT || process.env.STORAGE_ENDPOINT,
);

const bucket = process.env.STORAGE_BUCKET ?? "ovr";

export type DeletePrefixResult = {
  complete: boolean;
  deletedCount: number;
};

export type DeletePrefixFailure = {
  key: string | undefined;
  code: string | undefined;
  message: string | undefined;
};

const MAX_REPORTED_FAILURES = 5;

export class DeletePrefixError extends Error {
  constructor(
    readonly prefix: string,
    readonly failures: DeletePrefixFailure[],
    readonly deletedCount: number,
  ) {
    const sample = failures
      .slice(0, MAX_REPORTED_FAILURES)
      .map(({ key, code }) => `${key ?? "<unknown key>"} (${code ?? "unknown error"})`)
      .join(", ");
    const more =
      failures.length > MAX_REPORTED_FAILURES
        ? ` and ${failures.length - MAX_REPORTED_FAILURES} more`
        : "";

    super(`Failed to delete ${failures.length} object(s) under "${prefix}": ${sample}${more}`);
    this.name = "DeletePrefixError";
  }
}

export const storage = {
  uploadFile: async (key: string, body: Buffer | Readable, contentType: string): Promise<void> => {
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
  },

  objectExists: async (key: string): Promise<boolean> => {
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  },

  getFileStream: async (key: string): Promise<Readable> => {
    const { Body } = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    if (!(Body instanceof Readable)) {
      throw new Error(`Expected a readable stream for "${key}"`);
    }

    return Body;
  },

  deleteFile: async (key: string): Promise<void> => {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  copyObject: async (sourceKey: string, destinationKey: string): Promise<void> => {
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: destinationKey,
        CopySource: `${bucket}/${sourceKey}`,
      }),
    );
  },

  deletePrefix: async (
    prefix: string,
    { signal, reason = "other" }: { signal?: AbortSignal; reason?: StorageDeleteReason } = {},
  ): Promise<DeletePrefixResult> => {
    if (prefix === "") {
      throw new Error("Refusing to delete an empty prefix, which would empty the whole bucket");
    }

    const failures: DeletePrefixFailure[] = [];
    let deletedCount = 0;
    let complete = true;
    let continuationToken: string | undefined;

    do {
      if (signal?.aborted) {
        complete = false;
        break;
      }

      const { Contents, NextContinuationToken } = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = (Contents ?? [])
        .filter((object): object is { Key: string } => object.Key !== undefined)
        .map(({ Key }) => ({ Key }));

      if (objects.length > 0) {
        // DeleteObjects answers 200 even when some keys fail.
        const { Errors } = await client.send(
          new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }),
        );
        const pageFailures = (Errors ?? []).map(({ Key, Code, Message }) => ({
          key: Key,
          code: Code,
          message: Message,
        }));

        failures.push(...pageFailures);
        deletedCount += objects.length - pageFailures.length;
        objectsDeleted.add(objects.length - pageFailures.length, { reason });
        for (const { code } of pageFailures) {
          recordDeleteFailure(reason, code ?? "Unknown");
        }
      }

      continuationToken = NextContinuationToken;
    } while (continuationToken);

    if (failures.length > 0) {
      throw new DeletePrefixError(prefix, failures, deletedCount);
    }

    return { complete, deletedCount };
  },

  getPresignedUrl: async (key: string, ttlSeconds: number): Promise<string> => {
    return getSignedUrl(presignClient, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  },

  getPresignedUploadUrl: async (key: string, ttlSeconds: number): Promise<string> => {
    return getSignedUrl(presignClient, new PutObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  },
};
