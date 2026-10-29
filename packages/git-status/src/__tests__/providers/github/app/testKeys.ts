import { generateKeyPairSync } from "node:crypto";

export const { privateKey: TEST_PRIVATE_KEY, publicKey: TEST_PUBLIC_KEY } = generateKeyPairSync(
  "rsa",
  { modulusLength: 2048 },
);

export const TEST_PRIVATE_KEY_PEM = TEST_PRIVATE_KEY.export({
  type: "pkcs1",
  format: "pem",
}).toString();
