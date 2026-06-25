import { Readable } from "node:stream";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";

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
  }),
});

const bucket = process.env.STORAGE_BUCKET ?? "ovr";

export const storage = {
  uploadFile: async (key: string, body: Buffer | Readable, contentType: string): Promise<void> => {
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
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
