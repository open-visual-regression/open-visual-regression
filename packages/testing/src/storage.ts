import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";

import type { RustfsContainer } from "./containers";

export const createBucket = async (rustfs: RustfsContainer, bucket: string): Promise<void> => {
  const client = new S3Client({
    endpoint: rustfs.endpoint,
    region: "us-east-1",
    credentials: { accessKeyId: rustfs.accessKey, secretAccessKey: rustfs.secretKey },
    forcePathStyle: true,
  });

  await client.send(new CreateBucketCommand({ Bucket: bucket }));
};
