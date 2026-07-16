import { randomBytes } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertEncryptionKey,
  decryptToken,
  encryptToken,
  MissingEncryptionKeyError,
} from "../crypto";

const KEY = randomBytes(32).toString("base64");

describe("crypto", () => {
  beforeEach(() => {
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a token", () => {
    const token = "ghp_example_secret_value";
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  it("produces a different ciphertext each time", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });

  it("rejects a tampered payload", () => {
    const encrypted = encryptToken("secret");
    const bytes = Buffer.from(encrypted, "base64");
    bytes[bytes.length - 1]! ^= 0xff;
    expect(() => decryptToken(bytes.toString("base64"))).toThrow(/authenticate/i);
  });

  it("throws when the key is missing", () => {
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", "");
    expect(() => assertEncryptionKey()).toThrow(MissingEncryptionKeyError);
  });

  it("throws when the key is the wrong length", () => {
    vi.stubEnv("OVR_GIT_TOKEN_ENCRYPTION_KEY", Buffer.from("short").toString("base64"));
    expect(() => assertEncryptionKey()).toThrow(MissingEncryptionKeyError);
  });
});
