import { Typography } from "@ovr/ui/components/typography";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";

export type NewSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
};

export const NewSnapshotPane = ({ imagePath, alt }: NewSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader>
      <Typography variant="label">new</Typography>
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} />
  </SnapshotPane>
);
