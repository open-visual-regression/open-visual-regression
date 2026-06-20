"use client";

import { useState } from "react";
import { Switch } from "@ovr/ui/components/switch";
import { Typography } from "@ovr/ui/components/typography";

export type DiffOverlayProps = {
  label: string;
  imagePath: string | null;
  diffImagePath: string;
  alt: string;
};

export const DiffOverlay = ({ label, imagePath, diffImagePath, alt }: DiffOverlayProps) => {
  const [showDiff, setShowDiff] = useState(true);
  const [diffNaturalWidth, setDiffNaturalWidth] = useState<number | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number | null>(null);

  const imageWidthPercent =
    diffNaturalWidth && imageNaturalWidth ? (imageNaturalWidth / diffNaturalWidth) * 100 : 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-7 items-center justify-between">
        <Typography variant="label">{label}</Typography>
        <label className="flex items-center gap-2">
          <Typography variant="caption">show diff</Typography>
          <Switch checked={showDiff} onCheckedChange={setShowDiff} />
        </label>
      </div>
      <div className="relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
        {imagePath ? (
          <img
            src={`/api/storage/${imagePath}`}
            alt={alt}
            className="absolute top-0 left-0 block h-auto"
            style={{ width: `${imageWidthPercent}%` }}
            onLoad={(event) => setImageNaturalWidth(event.currentTarget.naturalWidth)}
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center">
            <Typography variant="caption">no preview</Typography>
          </div>
        )}
        <img
          src={`/api/storage/${diffImagePath}`}
          alt={`diff overlay of ${alt}`}
          className="relative block h-auto w-full"
          style={{ opacity: showDiff ? 1 : 0 }}
          onLoad={(event) => setDiffNaturalWidth(event.currentTarget.naturalWidth)}
        />
      </div>
    </div>
  );
};
