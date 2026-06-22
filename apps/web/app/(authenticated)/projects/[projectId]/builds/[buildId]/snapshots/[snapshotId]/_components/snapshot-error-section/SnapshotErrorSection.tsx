import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { getStoragePath } from "@/lib/utils/storage";
import { SnapshotPaneImage } from "../snapshot-pane/SnapshotPaneImage";

export type SnapshotErrorSectionProps = {
  snapshot: SnapshotSchema;
};

export const SnapshotErrorSection = ({ snapshot }: SnapshotErrorSectionProps) => {
  return (
    <div>
      <SnapshotPaneImage
        imagePath={getStoragePath(snapshot.imagePath)}
        alt={`snapshot of ${snapshot.targetTitle} ${snapshot.targetName}`}
      />
    </div>
  );
};
