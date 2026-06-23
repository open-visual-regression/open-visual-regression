import { Typography } from "@ovr/ui/components/typography";
import { Image } from "@/lib/components/image/Image";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
};

export const SnapshotPaneImage = ({ imagePath, alt }: SnapshotPaneImageProps) => (
  <div className="relative min-h-64 overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid lg:min-h-96">
    {imagePath ? (
      <Image
        src={imagePath}
        alt={alt}
        className="max-w-full h-auto mx-auto block"
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
