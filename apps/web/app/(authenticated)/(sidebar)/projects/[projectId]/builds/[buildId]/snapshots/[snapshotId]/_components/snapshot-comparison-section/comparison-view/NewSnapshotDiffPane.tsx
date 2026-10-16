import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";
import { SnapshotPaneImage } from "../../snapshot-pane/SnapshotPaneImage";
import { SnapshotZoomDialog } from "../../snapshot-zoom/SnapshotZoomDialog";

export type NewSnapshotDiffPaneProps = {
  label: string;
  imagePath: string | null;
  diffImagePath: string;
  alt: string;
  canvasImagePaths: (string | null)[];
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
};

export const NewSnapshotDiffPane = ({
  label,
  imagePath,
  diffImagePath,
  alt,
  canvasImagePaths,
  showDiff,
  onShowDiffChange,
}: NewSnapshotDiffPaneProps) => (
  <SnapshotPane>
    <SnapshotPaneHeader>
      <Typography variant="label">{label}</Typography>
      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-2">
          <Typography variant="caption">diff</Typography>
          <Switch checked={showDiff} onCheckedChange={onShowDiffChange} />
        </label>
        <SnapshotZoomDialog
          title={label}
          imagePath={imagePath}
          alt={alt}
          diffImagePath={diffImagePath}
        />
      </div>
    </SnapshotPaneHeader>
    <SnapshotPaneImage imagePath={imagePath} alt={alt} canvasImagePaths={canvasImagePaths}>
      <img
        src={diffImagePath}
        alt={`diff overlay of ${alt}`}
        className={cn(
          "absolute top-0 left-0 block h-auto w-full",
          showDiff ? "opacity-100" : "opacity-0",
        )}
      />
    </SnapshotPaneImage>
  </SnapshotPane>
);
