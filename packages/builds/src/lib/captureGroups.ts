import { z } from "zod";

// Max snapshots sharing one warm browser per capture-group job.
const CAPTURE_GROUP_SIZE = z.coerce
  .number()
  .int()
  .positive()
  .catch(10)
  .parse(process.env.OVR_CAPTURE_GROUP_SIZE);

type GroupableSnapshot = {
  id: string;
  browser: string;
  externalRequestAllowlist: string[] | null;
};

export type CaptureGroup = {
  browser: string;
  externalRequestAllowlist: string[] | null;
  snapshotIds: string[];
};

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

export const toCaptureGroups = (snapshots: GroupableSnapshot[]): CaptureGroup[] => {
  const byPage = snapshots.reduce((groups, { id, browser, externalRequestAllowlist }) => {
    const key = JSON.stringify([browser, externalRequestAllowlist]);
    const group = groups.get(key) ?? { browser, externalRequestAllowlist, snapshotIds: [] };
    groups.set(key, { ...group, snapshotIds: [...group.snapshotIds, id] });
    return groups;
  }, new Map<string, CaptureGroup>());

  return Array.from(byPage.values()).flatMap(({ snapshotIds, ...page }) =>
    chunk(snapshotIds, CAPTURE_GROUP_SIZE).map((group) => ({ ...page, snapshotIds: group })),
  );
};
