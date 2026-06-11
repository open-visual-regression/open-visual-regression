import type { Readable } from "node:stream";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cachedClient: S3Client | undefined;

const getClient = (): S3Client => {
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
        secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
      },
      forcePathStyle: true,
    });
  }

  return cachedClient;
};

const getBucket = (): string => process.env.STORAGE_BUCKET ?? "ovr";

export const uploadFile = async (
  key: string,
  body: Buffer | Readable,
  contentType: string,
): Promise<void> => {
  await getClient().send(
    new PutObjectCommand({ Bucket: getBucket(), Key: key, Body: body, ContentType: contentType }),
  );
};

export const getFileStream = async (key: string): Promise<Readable> => {
  const { Body } = await getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));

  return Body as Readable;
};

export const deleteFile = async (key: string): Promise<void> => {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
};

export const deletePrefix = async (prefix: string): Promise<void> => {
  const client = getClient();
  const bucket = getBucket();
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
      await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }));
    }

    continuationToken = NextContinuationToken;
  } while (continuationToken);
};

export const getPresignedUrl = async (key: string, ttlSeconds: number): Promise<string> => {
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: getBucket(), Key: key }), {
    expiresIn: ttlSeconds,
  });
};
