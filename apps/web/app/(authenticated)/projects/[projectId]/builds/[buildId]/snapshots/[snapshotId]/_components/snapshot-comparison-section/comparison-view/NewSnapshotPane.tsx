import { Typography } from "@ovr/ui/components/typography";

import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";

export type NewSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  className?: string;
};

export const NewSnapshotPane = ({ imagePath, alt, className }: NewSnapshotPaneProps) => (
  <SnapshotPane className={className}>
    <SnapshotPaneHeader>
      <Typography variant="label">new</Typography>
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} />
  </SnapshotPane>
);
