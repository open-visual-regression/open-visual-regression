import { z } from "zod";

// Max snapshots sharing one warm browser per capture-group job.
const CAPTURE_GROUP_SIZE = z.coerce
  .number()
  .int()
  .positive()
  .catch(10)
  .parse(process.env.OVR_CAPTURE_GROUP_SIZE);

type GroupableSnapshot = { id: string; browser: string };

export type CaptureGroup = { browser: string; snapshotIds: string[] };

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

export const toCaptureGroups = (snapshots: GroupableSnapshot[]): CaptureGroup[] => {
  const byBrowser = snapshots.reduce((groups, snapshot) => {
    groups.set(snapshot.browser, [...(groups.get(snapshot.browser) ?? []), snapshot.id]);
    return groups;
  }, new Map<string, string[]>());

  return Array.from(byBrowser.entries()).flatMap(([browser, snapshotIds]) =>
    chunk(snapshotIds, CAPTURE_GROUP_SIZE).map((group) => ({ browser, snapshotIds: group })),
  );
};
