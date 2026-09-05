"use client";

import { useState } from "react";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { Image } from "@/lib/components/image/Image";

import { useReportAspectRatio } from "../../snapshot-pane/snapshot-fit";
import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneHeader } from "../../snapshot-pane/SnapshotPaneHeader";

export type NewSnapshotDiffPaneProps = {
  label: string;
  imagePath: string | null;
  diffImagePath: string;
  alt: string;
  showDiff: boolean;
};

export const NewSnapshotDiffPane = ({
  label,
  imagePath,
  diffImagePath,
  alt,
  showDiff,
}: NewSnapshotDiffPaneProps) => {
  const [diffNaturalWidth, setDiffNaturalWidth] = useState<number | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number | null>(null);
  const reportSnapshotAspectRatio = useReportAspectRatio();
  const reportDiffAspectRatio = useReportAspectRatio();

  const imageWidthPercent =
    diffNaturalWidth && imageNaturalWidth ? (imageNaturalWidth / diffNaturalWidth) * 100 : 100;

  return (
    <SnapshotPane>
      <SnapshotPaneHeader>
        <Typography variant="label">{label}</Typography>
      </SnapshotPaneHeader>
      <div className="relative min-h-64 overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid lg:min-h-96">
        {imagePath ? (
          <Image
            src={imagePath}
            alt={alt}
            className="absolute top-0 left-0 block h-auto"
            style={{ width: `${imageWidthPercent}%` }}
            onLoaded={(image) => {
              setImageNaturalWidth(image.naturalWidth);
              reportSnapshotAspectRatio(image);
            }}
            errorFallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <Typography variant="caption">failed to load snapshot</Typography>
              </div>
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="caption">no preview</Typography>
          </div>
        )}
        <img
          src={diffImagePath}
          alt={`diff overlay of ${alt}`}
          className={cn("relative block h-auto w-full", showDiff ? "opacity-100" : "opacity-0")}
          onLoad={(event) => {
            setDiffNaturalWidth(event.currentTarget.naturalWidth);
            reportDiffAspectRatio(event.currentTarget);
          }}
        />
      </div>
    </SnapshotPane>
  );
};
