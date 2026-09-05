import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { Image } from "@/lib/components/image/Image";

import { SnapshotPaneCanvas } from "./SnapshotPaneCanvas";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
  fill?: boolean;
};

export const SnapshotPaneImage = ({ imagePath, alt, fill = false }: SnapshotPaneImageProps) => (
  <SnapshotPaneCanvas>
    {imagePath ? (
      <Image
        src={imagePath}
        alt={alt}
        className={cn(
          "block h-auto lg:max-h-full lg:w-auto lg:max-w-full",
          fill ? "w-full" : "mx-auto max-w-full",
        )}
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
  </SnapshotPaneCanvas>
);
