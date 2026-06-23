import { Typography } from "@ovr/ui/components/typography";
import { Image } from "@/lib/components/Image/Image";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
};

export const SnapshotPaneImage = ({ imagePath, alt }: SnapshotPaneImageProps) => (
  <div className="relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
    {imagePath ? (
      <Image
        src={imagePath}
        alt={alt}
        className="max-w-full h-auto mx-auto block"
        skeletonClassName="h-40 w-full"
        errorFallback={
          <div className="flex h-40 items-center justify-center">
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
