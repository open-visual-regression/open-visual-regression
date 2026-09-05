"use client";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { Image } from "@/lib/components/image/Image";

import { FIT_BOX_CLASS, FIT_IMAGE_CLASS, useReportAspectRatio } from "./snapshot-fit";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
  fill?: boolean;
};

export const SnapshotPaneImage = ({ imagePath, alt, fill = false }: SnapshotPaneImageProps) => {
  const reportAspectRatio = useReportAspectRatio();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid",
        FIT_BOX_CLASS,
      )}
    >
      {imagePath ? (
        <Image
          src={imagePath}
          alt={alt}
          onLoaded={reportAspectRatio}
          className={cn("h-auto block", fill ? "w-full" : "max-w-full", FIT_IMAGE_CLASS)}
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
    </div>
  );
};
