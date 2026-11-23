import { Typography } from "@ovr/ui/components/typography";

import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotZoomTrigger } from "../../snapshot-zoom/SnapshotZoomTrigger";

export type NewSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  canvasImagePaths?: (string | null)[];
  diffImagePath?: string | null;
  showDiff?: boolean;
};

export const NewSnapshotPane = ({
  imagePath,
  alt,
  canvasImagePaths,
  diffImagePath = null,
  showDiff = false,
}: NewSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="gap-2">
      <Typography variant="label">new</Typography>
    </SnapshotPaneHeader>
    <SnapshotPaneImage
      imagePath={imagePath}
      alt={alt}
      canvasImagePaths={canvasImagePaths}
      overlay={diffImagePath ? { imagePath: diffImagePath, visible: showDiff } : undefined}
      trigger={<SnapshotZoomTrigger view="new" disabled={!imagePath} />}
    />
  </SnapshotPane>
);
