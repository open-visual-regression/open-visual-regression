import { Typography } from "@ovr/ui/components/typography";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";

export type BaselineSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  fill?: boolean;
  commitSha: string | null;
  commitUrl: string | null;
};

export const BaselineSnapshotPane = ({
  imagePath,
  alt,
  fill,
  commitSha,
  commitUrl,
}: BaselineSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="gap-2">
      <Typography variant="label">baseline</Typography>
      <BaselineCommitLink commitSha={commitSha} commitUrl={commitUrl} />
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} fill={fill} />
  </SnapshotPane>
);
