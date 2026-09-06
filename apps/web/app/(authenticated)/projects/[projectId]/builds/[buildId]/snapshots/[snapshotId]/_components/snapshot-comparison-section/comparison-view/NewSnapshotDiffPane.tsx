"use client";

import { useState } from "react";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { Image } from "@/lib/components/image/Image";

import { SnapshotPane } from "../../snapshot-pane/SnapshotPane";
import { SnapshotPaneCanvas } from "../../snapshot-pane/SnapshotPaneCanvas";
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
  const [diffNaturalSize, setDiffNaturalSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number | null>(null);

  const imageWidthPercent =
    diffNaturalSize && imageNaturalWidth ? (imageNaturalWidth / diffNaturalSize.width) * 100 : 100;

  return (
    <SnapshotPane>
      <SnapshotPaneHeader>
        <Typography variant="label">{label}</Typography>
      </SnapshotPaneHeader>
      <SnapshotPaneCanvas>
        <div
          className="relative w-full lg:max-h-full lg:w-auto lg:max-w-full"
          style={
            diffNaturalSize
              ? { aspectRatio: `${diffNaturalSize.width}/${diffNaturalSize.height}` }
              : undefined
          }
        >
          {imagePath ? (
            <Image
              src={imagePath}
              alt={alt}
              className="absolute top-0 left-0 block h-auto"
              style={{ width: `${imageWidthPercent}%` }}
              onLoad={(event) => setImageNaturalWidth(event.currentTarget.naturalWidth)}
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
            className={cn(
              "relative block h-auto w-full lg:h-full",
              showDiff ? "opacity-100" : "opacity-0",
            )}
            onLoad={(event) =>
              setDiffNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        </div>
      </SnapshotPaneCanvas>
    </SnapshotPane>
  );
};
