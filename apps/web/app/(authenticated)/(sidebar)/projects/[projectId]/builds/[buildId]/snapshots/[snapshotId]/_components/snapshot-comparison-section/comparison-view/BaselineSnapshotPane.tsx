import { Typography } from "@ovr/ui/components/typography";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotZoomDialog } from "../../snapshot-zoom/SnapshotZoomDialog";

export type BaselineSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  commitSha: string | null;
  commitUrl: string | null;
  canvasImagePaths: (string | null)[];
};

export const BaselineSnapshotPane = ({
  imagePath,
  alt,
  commitSha,
  commitUrl,
  canvasImagePaths,
}: BaselineSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="gap-2">
      <Typography variant="label">baseline</Typography>
      <BaselineCommitLink commitSha={commitSha} commitUrl={commitUrl} />
      <SnapshotZoomDialog
        title="baseline"
        imagePath={imagePath}
        alt={alt}
        commitSha={commitSha}
        commitUrl={commitUrl}
      />
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} canvasImagePaths={canvasImagePaths} />
  </SnapshotPane>
);
