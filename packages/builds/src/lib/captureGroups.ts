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
  externalRequestAllowlist?: string[] | null;
};

export type CaptureGroup = { browser: string; snapshotIds: string[] };

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

// Snapshots that block different external hosts need different pages, so they're grouped apart.
export const toCaptureGroups = (snapshots: GroupableSnapshot[]): CaptureGroup[] => {
  const byPage = snapshots.reduce((groups, snapshot) => {
    const allowlist = snapshot.externalRequestAllowlist;
    const key = JSON.stringify([
      snapshot.browser,
      allowlist == null ? null : [...allowlist].sort(),
    ]);
    const group = groups.get(key) ?? { browser: snapshot.browser, snapshotIds: [] };
    group.snapshotIds.push(snapshot.id);
    groups.set(key, group);
    return groups;
  }, new Map<string, CaptureGroup>());

  return Array.from(byPage.values()).flatMap(({ browser, snapshotIds }) =>
    chunk(snapshotIds, CAPTURE_GROUP_SIZE).map((group) => ({ browser, snapshotIds: group })),
  );
};
