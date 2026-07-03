import { SnapshotSchema } from "@ovr/api/contracts/snapshots";

import { SnapshotLogs } from "./SnapshotLogs";

type SnapshotSidebarLogsContentProps = {
  snapshot: SnapshotSchema;
};

export const SnapshotSidebarLogsContent = ({ snapshot }: SnapshotSidebarLogsContentProps) => {
  return (
    <div className="px-3">
      <SnapshotLogs logs={snapshot.errorLogs} />
    </div>
  );
};
