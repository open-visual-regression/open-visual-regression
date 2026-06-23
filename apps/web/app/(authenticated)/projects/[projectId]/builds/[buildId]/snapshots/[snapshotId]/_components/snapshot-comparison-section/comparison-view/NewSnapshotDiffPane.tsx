"use client";

import { useState } from "react";
import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";
import { Image } from "@/lib/components/Image/Image";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";

export type NewSnapshotDiffPaneProps = {
  label: string;
  imagePath: string | null;
  diffImagePath: string;
  alt: string;
};

export const NewSnapshotDiffPane = ({
  label,
  imagePath,
  diffImagePath,
  alt,
}: NewSnapshotDiffPaneProps) => {
  const [showDiff, setShowDiff] = useState(true);
  const [diffNaturalWidth, setDiffNaturalWidth] = useState<number | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number | null>(null);

  const imageWidthPercent =
    diffNaturalWidth && imageNaturalWidth ? (imageNaturalWidth / diffNaturalWidth) * 100 : 100;

  return (
    <SnapshotPane>
      <SnapshotPaneHeader className="justify-between">
        <Typography variant="label">{label}</Typography>
        <label className="flex items-center gap-2">
          <Typography variant="caption">show diff</Typography>
          <Switch checked={showDiff} onCheckedChange={setShowDiff} />
        </label>
      </SnapshotPaneHeader>
      <div className="relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
        {imagePath ? (
          <Image
            src={imagePath}
            alt={alt}
            className="absolute top-0 left-0 block h-auto"
            style={{ width: `${imageWidthPercent}%` }}
            skeletonClassName="h-40 w-40"
            onLoad={(event) => setImageNaturalWidth(event.currentTarget.naturalWidth)}
            errorFallback={
              <div className="flex h-40 w-40 items-center justify-center">
                <Typography variant="caption">failed to load snapshot</Typography>
              </div>
            }
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center">
            <Typography variant="caption">no preview</Typography>
          </div>
        )}
        <img
          src={diffImagePath}
          alt={`diff overlay of ${alt}`}
          className={cn("relative block h-auto w-full", showDiff ? "opacity-100" : "opacity-0")}
          onLoad={(event) => setDiffNaturalWidth(event.currentTarget.naturalWidth)}
        />
      </div>
    </SnapshotPane>
  );
};
