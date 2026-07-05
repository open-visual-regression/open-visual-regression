import { Readable } from "node:stream";

import {
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

const presignClient = process.env.STORAGE_PUBLIC_ENDPOINT
  ? createClient(process.env.STORAGE_PUBLIC_ENDPOINT)
  : client;

const bucket = process.env.STORAGE_BUCKET ?? "ovr";

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
