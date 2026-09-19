import { buildsCursorSchema, type BuildsCursor } from "@ovr/api/contracts/builds";
import { snapshotsCursorSchema, type SnapshotsCursor } from "@ovr/api/contracts/snapshots";

const INVALID_CURSOR_MESSAGE =
  "Invalid --cursor value. Pass the cursor printed by a previous run of this command.";

const encode = (cursor: unknown): string =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

const decode = (token: string): unknown => {
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }
};

export const encodeBuildsCursor = (cursor: BuildsCursor): string => encode(cursor);

export const decodeBuildsCursor = (token: string): BuildsCursor => {
  const parsed = buildsCursorSchema.safeParse(decode(token));

  if (!parsed.success) {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  return parsed.data;
};

export const encodeSnapshotsCursor = (cursor: SnapshotsCursor): string => encode(cursor);

export const decodeSnapshotsCursor = (token: string): SnapshotsCursor => {
  const parsed = snapshotsCursorSchema.safeParse(decode(token));

  if (!parsed.success) {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  return parsed.data;
};
