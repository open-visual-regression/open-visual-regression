import { type SnapshotViewportFilterSchema } from "@ovr/api/contracts/snapshots";

export const encodeViewportFilterValue = ({
  viewportWidth,
  viewportHeight,
}: SnapshotViewportFilterSchema): string => `${viewportWidth}x${viewportHeight ?? "auto"}`;

export const decodeViewportFilterValue = (value: string): SnapshotViewportFilterSchema | null => {
  const match = /^(\d+)x(\d+|auto)$/.exec(value);
  if (!match) {
    return null;
  }

  const [, width, height] = match;
  return {
    viewportWidth: Number(width),
    viewportHeight: height === "auto" ? null : Number(height),
  };
};
