import { DeleteBucketPolicyCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";
import { test as vitest } from "vitest";

import { storage } from "../index";

export { describe, expect } from "vitest";

type Fixtures = {
  key: string;
  prefix: string;
  denyDeletes: (key: string) => Promise<void>;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  key: async ({}, use) => {
    const key = `test/${crypto.randomUUID()}.png`;
    await use(key);
    await storage.deleteFile(key);
  },

  // eslint-disable-next-line no-empty-pattern
  prefix: async ({}, use) => {
    const prefix = `test/${crypto.randomUUID()}/`;
    await use(prefix);
    await storage.deletePrefix(prefix);
  },

  // Depends on prefix so the policy is lifted before the prefix is cleaned up.
  denyDeletes: async ({ prefix: _prefix }, use) => {
    const bucket = process.env.STORAGE_BUCKET!;
    const admin = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });

    await use(async (key) => {
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Deny",
            Principal: { AWS: ["*"] },
            Action: ["s3:DeleteObject"],
            Resource: [`arn:aws:s3:::${bucket}/${key}`],
          },
        ],
      };
      await admin.send(
        new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }),
      );
    });

    await admin.send(new DeleteBucketPolicyCommand({ Bucket: bucket }));
    admin.destroy();
  },
});
