import { Typography } from "@ovr/ui/components/typography";

import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotZoomDialog } from "../../snapshot-zoom/SnapshotZoomDialog";

export type NewSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
};

export const NewSnapshotPane = ({ imagePath, alt }: NewSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader>
      <Typography variant="label">new</Typography>
      <SnapshotZoomDialog title="new" imagePath={imagePath} alt={alt} />
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} />
  </SnapshotPane>
);
