import { Typography } from "@ovr/ui/components/typography";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";

export type BaselineSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  fill?: boolean;
};

export const BaselineSnapshotPane = ({ imagePath, alt, fill }: BaselineSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader>
      <Typography variant="label">baseline</Typography>
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} fill={fill} />
  </SnapshotPane>
);
