import { Typography } from "@ovr/ui/components/typography";

import { SnapshotDimensions } from "../../snapshot-pane/SnapshotDimensions";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotZoomTrigger } from "../../snapshot-zoom/SnapshotZoomTrigger";

export type NewSnapshotPaneProps = {
  imagePath: string | null;
  alt: string;
  canvasImagePaths?: (string | null)[];
};

export const NewSnapshotPane = ({ imagePath, alt, canvasImagePaths }: NewSnapshotPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader className="gap-2">
      <Typography variant="label">new</Typography>
      <SnapshotDimensions
        imagePath={imagePath}
        comparedImagePaths={canvasImagePaths ?? [imagePath]}
      />
    </SnapshotPaneHeader>
    <SnapshotPaneImage
      imagePath={imagePath}
      alt={alt}
      canvasImagePaths={canvasImagePaths}
      trigger={<SnapshotZoomTrigger view="new" disabled={!imagePath} />}
    />
  </SnapshotPane>
);
