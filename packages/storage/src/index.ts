import { Readable } from "node:stream";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";

import { createLogger } from "@ovr/logger";

const logger = createLogger("storage");

const KEEP_ALIVE_MAX_SOCKETS = 50;

const client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5_000,
    socketTimeout: 30_000,
    httpAgent: { keepAlive: true, maxSockets: KEEP_ALIVE_MAX_SOCKETS },
    httpsAgent: { keepAlive: true, maxSockets: KEEP_ALIVE_MAX_SOCKETS },
  }),
});

const bucket = process.env.STORAGE_BUCKET ?? "ovr";

export const ensureBucket = async (): Promise<void> => {
  if (process.env.STORAGE_CREATE_BUCKET === "false") {
    logger.debug({ bucket }, "bucket bootstrap disabled via STORAGE_CREATE_BUCKET");
    return;
  }

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    logger.debug({ bucket }, "storage bucket already exists");
    return;
  } catch (error) {
    const statusCode =
      error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;

    // Only a definitive "not found" warrants creating the bucket. Anything else
    // (e.g. a 403 from object-scoped credentials on managed S3) means we cannot
    // verify it but should assume it exists rather than fail.
    if (statusCode !== 404) {
      logger.warn(
        { bucket, statusCode, err: error },
        "could not verify the storage bucket; assuming it exists",
      );
      return;
    }

    logger.info({ bucket }, "storage bucket not found; creating it");
  }

  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    logger.info({ bucket }, "created storage bucket");
  } catch (error) {
    if (
      error instanceof S3ServiceException &&
      (error.name === "BucketAlreadyOwnedByYou" || error.name === "BucketAlreadyExists")
    ) {
      logger.debug({ bucket }, "storage bucket was created concurrently");
      return;
    }

    logger.error({ bucket, err: error }, "failed to create the storage bucket");
  }
};

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

  deletePrefix: async (prefix: string): Promise<void> => {
    let continuationToken: string | undefined;

    do {
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
        await client.send(
          new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }),
        );
      }

      continuationToken = NextContinuationToken;
    } while (continuationToken);
  },

  getPresignedUrl: async (key: string, ttlSeconds: number): Promise<string> => {
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  },

  getPresignedUploadUrl: async (key: string, ttlSeconds: number): Promise<string> => {
    return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  },
};
