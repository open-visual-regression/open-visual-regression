import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const ENV_VAR = "OVR_GIT_TOKEN_ENCRYPTION_KEY";

export class MissingEncryptionKeyError extends Error {
  constructor(detail: string) {
    super(`${ENV_VAR} ${detail}. Generate one with: openssl rand -base64 32`);
    this.name = "MissingEncryptionKeyError";
  }
}

const getKey = (): Buffer => {
  const raw = process.env[ENV_VAR];
  if (!raw) {
    throw new MissingEncryptionKeyError("is required but not set");
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new MissingEncryptionKeyError("must be valid base64");
  }

  if (key.length !== KEY_BYTES) {
    throw new MissingEncryptionKeyError(`must decode to ${KEY_BYTES} bytes (got ${key.length})`);
  }

  return key;
};

export const assertEncryptionKey = (): void => {
  getKey();
};

export const encryptToken = (plaintext: string): string => {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
};

export const decryptToken = (payload: string): string => {
  const key = getKey();
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, IV_BYTES);
  const authTag = buffer.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = buffer.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
};
