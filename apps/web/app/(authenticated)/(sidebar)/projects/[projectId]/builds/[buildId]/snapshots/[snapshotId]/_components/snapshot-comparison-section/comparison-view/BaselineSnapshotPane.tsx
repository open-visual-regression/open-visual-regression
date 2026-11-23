import { Typography } from "@ovr/ui/components/typography";

import { BaselineCommitLink } from "../../snapshot-pane/BaselineCommitLink";
import { DiffKey } from "../../snapshot-pane/DiffKey";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotZoomTrigger } from "../../snapshot-zoom/SnapshotZoomTrigger";

export type BaselineSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  commitSha: string | null;
  commitUrl: string | null;
  canvasImagePaths: (string | null)[];
  diffImagePath?: string | null;
  showDiff?: boolean;
  /** Whether to say what the overlay's color means, which only holds for two-sided diffs. */
  showDiffKey?: boolean;
};

export const BaselineSnapshotPane = ({
  imagePath,
  alt,
  commitSha,
  commitUrl,
  canvasImagePaths,
  diffImagePath = null,
  showDiff = false,
  showDiffKey = false,
}: BaselineSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="gap-2">
      <Typography variant="label">baseline</Typography>
      <BaselineCommitLink commitSha={commitSha} commitUrl={commitUrl} />
      {diffImagePath && showDiff && showDiffKey ? (
        <span className="ml-auto">
          <DiffKey kind="removed" />
        </span>
      ) : null}
    </SnapshotPaneHeader>
    <SnapshotPaneImage
      imagePath={imagePath}
      alt={alt}
      canvasImagePaths={canvasImagePaths}
      overlay={diffImagePath ? { imagePath: diffImagePath, visible: showDiff } : undefined}
      trigger={<SnapshotZoomTrigger view="baseline" disabled={!imagePath} />}
    />
  </SnapshotPane>
);
